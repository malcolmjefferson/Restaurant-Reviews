import axios from "axios";

export default axios.create({
    //set default params. all routes come after this.
    baseURL: "http://localhost:5000/api/v1/restaurants",
    headers: {
        "Content-type": "application/json"
    }
});