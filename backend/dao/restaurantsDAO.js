import mongodb from "mongodb"
const ObjectId = mongodb.ObjectID

let restaurants

export default class RestaurantsDAO {
    // called as soon as the server starts. This is how we initially connect to the DB.
    static async injectDB(conn) {
        // if we already have a reference to our restaurants DB return
        if (restaurants) {
            return
        }
        // try and get a connection to the DB / reference
        try {
            //RESTREVIEWS_NS = name of database
            //get collection of restaurants or throw error if you cant
            restaurants = await conn.db(process.env.RESTREVIEWS_NS).collection("restaurants")
        } catch(e) {
            console.error(
                `Unable to establish a connection handle in restaurantsDAO: ${e}`
            )
        }
    }

    static async getRestaurants ({
        filters = null,
        page = 0,
        restaurantsPerPage = 20,
    } = {}) {
        let query
        if (filters) {
            if("name" in filters) {
                query = { $text: { $search: filters["name"]}}
            } else if ("cuisine" in filters) {
                query = {"cuisine": { $eq: filters["cuisine"]}}
            } else if ("zipcode" in filters) {
                query = {"address.zipcode": { $eq: filters["zipcode"]}}
            }
        }

        let cursor

        try {
            cursor = await restaurants
                .find(query)
        } catch (e) {
            console.error(`Unable to issue find command, ${e}`)
            return {restaurantsList: [], totalNumRestaurants:0}
        }
        // In the cursor is every single entry, so we want to use limit to limit the amount of restaurants
        // shown per page. We also want to use skip so we can get the page number.
        const displayCursor = cursor.limit(restaurantsPerPage).skip(restaurantsPerPage * page)

        try {
            const restaurantsList = await displayCursor.toArray()
            const totalNumRestaurants = await restaurants.countDocuments(query)

            return { restaurantsList, totalNumRestaurants }
        } catch (e) {
            console.error(
                `Unable to convert cursor to array or problem counting documents, ${e}`
            )
            return {restaurantsList: [], totalNumRestaurants: 0}
        }
    }

    static async getRestaurantByID(id) {
        try {
            const pipeline = [
                {
                    $match: {
                        _id: new ObjectId(id),
                    },
                },
                {
                    $lookup: {
                        from: "reviews",
                        let: {
                            id: "$_id",

                        },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ["$restaurant_id", "$$id"],
                                    },
                                },
                            },
                            {
                                $sort: {
                                    date: -1,
                                },
                            },
                        ],
                        as: "reviews",
                    },
                },
                {
                    $addFields: {
                        reviews: "$reviews",
                    },
                },
            ]
            return await restaurants.aggregate(pipeline).next()
        } catch (e) {
            console.error(`Something went wrong in getRestaurantByID: ${e}`)
            throw e
        }
    }

    static async getCuisines() {
        let cuisines = []
        try {
            cuisines = await restaurants.distinct("cuisine")
            return cuisines
        } catch (e) {
            console.error(`Unable to get cuisines, ${e}`)
            throw e
        }
    }
}