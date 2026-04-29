import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import "./Dealers.css";
import "../assets/style.css";
import Header from '../Header/Header';

const PostReview = () => {
  const [dealer, setDealer] = useState({});
  const [review, setReview] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [date, setDate] = useState("");
  const [carmodels, setCarmodels] = useState([]);
  
  const params = useParams();
  const navigate = useNavigate();
  const id = params.id;

  // استخدام روابط نسبية لضمان التوافق مع بيئة الرابط في المتصفح
  const dealer_url = `/djangoapp/dealer/${id}`;
  const review_url = `/djangoapp/add_review`;
  const carmodels_url = `/djangoapp/get_cars`;

  const postreview = async () => {
    let name = sessionStorage.getItem("firstname") + " " + sessionStorage.getItem("lastname");
    if (name.includes("null") || name.trim() === "") {
      name = sessionStorage.getItem("username");
    }

    if (!model || review === "" || date === "" || year === "") {
      alert("All details are mandatory");
      return;
    }

    const model_split = model.split(" ");
    const make_chosen = model_split[0];
    const model_chosen = model_split[1];

    const jsoninput = JSON.stringify({
      "name": name,
      "dealership": id,
      "review": review,
      "purchase": true,
      "purchase_date": date,
      "car_make": make_chosen,
      "car_model": model_chosen,
      "car_year": year,
    });

    const res = await fetch(review_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: jsoninput,
    });

    const json = await res.json();
    if (json.status === 200) {
      // العودة لصفحة الوكيل بعد النجاح
      navigate(`/dealer/${id}`);
    }
  };

  const get_dealer = async () => {
    const res = await fetch(dealer_url);
    const retobj = await res.json();
    if (retobj.status === 200 && retobj.dealer) {
      const dealerData = Array.isArray(retobj.dealer) ? retobj.dealer[0] : retobj.dealer;
      setDealer(dealerData);
    }
  };

  const get_cars = async () => {
  const res = await fetch(carmodels_url);
  const retobj = await res.json();
  const carData = retobj.CarModels || retobj;
  if (Array.isArray(carData)) {
    setCarmodels(carData);
  } else {
    console.error("Data received is not an array:", carData);
  }
};

  useEffect(() => {
    get_dealer();
    get_cars();
  }, []);

  return (
    <div>
      <Header />
      <div style={{ margin: "5% 10%" }}>
        <h1 style={{ color: "darkblue", marginBottom: "20px" }}>
          {dealer.full_name || dealer.name}
        </h1>
        
        <div className="review_form">
          <label htmlFor="review_text">Write your review:</label>
          <textarea 
            id='review_text' 
            cols='50' 
            rows='7' 
            placeholder="Share your experience..."
            onChange={(e) => setReview(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '5px' }}
          ></textarea>

          <div className='input_field' style={{ marginTop: '20px' }}>
            <label>Purchase Date: </label>
            <input type="date" onChange={(e) => setDate(e.target.value)} />
          </div>

          <div className='input_field' style={{ marginTop: '15px' }}>
            <label>Car Make & Model: </label>
            <select name="cars" id="cars" onChange={(e) => setModel(e.target.value)}>
              <option value="" disabled selected>Choose Car Make and Model</option>
              {carmodels.map((carmodel, index) => (
                <option key={index} value={carmodel.CarMake + " " + carmodel.CarModel}>
                  {carmodel.CarMake} {carmodel.CarModel}
                </option>
              ))}
            </select>
          </div>

          <div className='input_field' style={{ marginTop: '15px' }}>
            <label>Car Year: </label>
            <input 
              type="number" 
              onChange={(e) => setYear(e.target.value)} 
              max={2026} 
              min={2015} 
              placeholder="YYYY"
            />
          </div>

          <div style={{ marginTop: '30px' }}>
            <button className='postreview' onClick={postreview}>Post Review</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostReview;