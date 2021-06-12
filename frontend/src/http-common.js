import axios from "axios";

export default axios.create({
    //set default params. all routes come after this.
    baseURL: "https://us-west-2.aws.webhooks.mongodb-realm.com/api/client/v2.0/app/restaurant-reviews-gscli/service/restaurants/incoming_webhook/",
    headers: {
        "Content-type": "application/json"
    }
});