from django.contrib.auth.models import User
from django.http import JsonResponse
from django.contrib.auth import login, authenticate, logout
import logging
import json
from django.views.decorators.csrf import csrf_exempt
from .populate import initiate
from .models import CarMake, CarModel
from .restapis import get_request, analyze_review_sentiments, post_review

# Get an instance of a logger
logger = logging.getLogger(__name__)


@csrf_exempt
def login_user(request):
    """Handle user login requests."""
    data = json.loads(request.body)
    username = data['userName']
    password = data['password']
    user = authenticate(username=username, password=password)
    data = {"userName": username}
    if user is not None:
        login(request, user)
        data = {"userName": username, "status": "Authenticated"}
    return JsonResponse(data)


def logout_request(request):
    """Handle user logout requests."""
    logout(request)
    data = {"userName": ""}
    return JsonResponse(data)


@csrf_exempt
def registration(request):
    """Handle new user registration."""
    data = json.loads(request.body)
    username = data['userName']
    password = data['password']
    first_name = data['firstName']
    last_name = data['lastName']
    email = data['email']
    username_exist = False

    try:
        # Check if user already exists
        User.objects.get(username=username)
        username_exist = True
    except User.DoesNotExist:
        logger.debug("{} is a new user".format(username))

    # If it's a new user, create the account
    if not username_exist:
        user = User.objects.create_user(
            username=username,
            first_name=first_name,
            last_name=last_name,
            password=password,
            email=email
        )
        login(request, user)
        data = {"userName": username, "status": "Authenticated"}
        return JsonResponse(data)
    else:
        data = {"userName": username, "error": "Already Registered"}
        return JsonResponse(data)


def get_cars(request):
    """Fetch car makes and models, populating the database if empty."""
    count = CarMake.objects.filter().count()
    if count == 0:
        initiate()
    car_models = CarModel.objects.select_related('car_make')
    cars = []
    for car_model in car_models:
        cars.append({
            "CarMake": car_model.car_make.name,
            "CarModel": car_model.name
        })
    return JsonResponse({"CarModels": cars})


def get_dealerships(request, state="All"):
    """Fetch dealerships based on the provided state."""
    if state == "All":
        endpoint = "/fetchDealers"
    else:
        endpoint = "/fetchDealers/" + state
    dealerships = get_request(endpoint)
    return JsonResponse({"status": 200, "dealers": dealerships})


def get_dealer_details(request, dealer_id):
    """Fetch details for a specific dealer."""
    if dealer_id:
        endpoint = "/fetchDealer/" + str(dealer_id)
        dealership = get_request(endpoint)
        return JsonResponse({"status": 200, "dealer": dealership})
    else:
        return JsonResponse({"status": 400, "message": "Bad Request"})


def get_dealer_reviews(request, dealer_id):
    """Fetch reviews for a dealer and perform sentiment analysis on each."""
    if dealer_id:
        endpoint = f"/fetchReviews/dealer/{dealer_id}"
        reviews = get_request(endpoint)

        for review_detail in reviews:
            try:
                # Call external sentiment analysis service
                response = analyze_review_sentiments(review_detail['review'])
                if response and 'sentiment' in response:
                    review_detail['sentiment'] = response['sentiment']
                else:
                    review_detail['sentiment'] = "neutral"
            except Exception:
                # Default to neutral if analysis service fails
                review_detail['sentiment'] = "neutral"

        return JsonResponse({"status": 200, "reviews": reviews})
    return JsonResponse({"status": 400, "message": "Bad Request"})


def add_review(request):
    """Allow authenticated users to post a review."""
    # Updated to 'is False' for PEP8 compliance
    if request.user.is_anonymous is False:
        data = json.loads(request.body)
        try:
            # Post review using external microservice
            post_review(data)
            return JsonResponse({"status": 200})
        except Exception:
            # Updated from bare except to Exception for better practice
            return JsonResponse({
                "status": 401,
                "message": "Error in posting review"
            })
    else:
        return JsonResponse({"status": 403, "message": "Unauthorized"})
