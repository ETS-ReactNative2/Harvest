var validator = require('validator');

const Communicator = require('./communicator.js')
const dbCom = new Communicator();

function stalkoverflow() {
    return new StalkOverflowAPI();
}

class StalkOverflowAPI {
    async parsePOSTRequest(req, res) {
        var reqType = req.get('RequestType');

        if (areWeTestingWithJest()) {
            reqType = req.headers['RequestType'];
        }
        
        console.log("Request Type:", reqType);

        switch(reqType) {
            case 'AddUser':
                await this.#addUser(req.body, res);
                return;
            case 'LoginUser':
                await this.#logUser(req.body, res);
                return;
            case 'AddFoodLog':
                await this.#addLog(req.body, res);
                return;
        }

        res.status(404);
        res.json({Error: "Unknown request type."});
    }

    async parseGETRequest(req, res) {
        var reqType = req.get('RequestType');
        
        if (areWeTestingWithJest()) {
            reqType = req.headers['RequestType'];
        }

        console.log("Request Type:", reqType);

        switch(reqType) {
            case 'GetHarvestLogs':
                await this.#getHarvestLog(req, res);
                return;
            case 'GetFoodTotalWeight':
                await this.#getFoodTotalWeight(req, res);
                return;
            case 'GetAllFoodNames':
                await this.#getAllFoodNames(req, res);
                return;
            case 'GetFilteredLogs':
                await this.#getFilteredLog(req, res);
                return;
            case 'GetAtlas':
                await this.#getAtlas(req, res);
                return;
            case 'GetLogsTotalWeight':
                await this.#getLogsTotalWeight(req, res);
                return;
        }

        res.status(404);
        res.json({Error: "Unknown request type."});
    }

    // POST REQUESTS
    async #addUser(body, res) {
        var userID;
        var username;
        var email;

        // Validate Request Parameters
        try {
            if(!(userID = body.UserID)) throw new Error("UserID not found.");
            if(!(username = body.Username)) throw new Error("Username not found.");
            if(!(email = body.Email)) throw new Error("Email not found.");          

            if (!(typeof userID === 'string')) throw new Error("Invalid UserID format.");
            if (!(typeof username === 'string')) throw new Error("Invalid Username format.");
            if (!validator.isEmail(email)) throw new Error("Invalid Email format.");

        } catch (err) {
            console.log(err.message);
            res.status(400);
            return res.json({Error : err.message});
        }

        // Send to database and check for errors
        try {
            var result = await dbCom.addUser(username, email, userID);
            console.log("Result:", result);
            res.status(201);
            res.send("Success");
        } catch (err) {
            console.log("Error:", err);
            res.status(500);
            return res.json({Error : err.detail});
        }
    }

    async #logUser(body, res) {
        var userID;

        try {
            if(!(userID = body.UserID)) throw new Error("UserID not found.");

            if (!(typeof userID === 'string')) throw new Error("Invalid UserID format.");

        } catch (err) {
            console.log(err.message);
            res.status(400);
            return res.json({Error : err.message});
        }

        // Send to database and check for errors
        try {
            var result = await dbCom.logUser(userID);
            console.log("Result:", result);

            if (result.rowCount == 0) {
                res.status(418);
                return res.json({});
            } else {
                res.status(201);
                return res.send("Success");
            }           
        } catch (err) {
            console.log("Error:", err);
            res.status(500);
            return res.json({Error : err.detail});
        }
    }

    async #addLog(body, res) {
        var userID;
        var foodName;
        var weight;

        try {
            if(!(userID = body.UserID)) throw new Error("UserID not found.");
            if(!(foodName = body.FoodName)) throw new Error("FoodName param not found.");
            if(!(weight = body.Weight)) throw new Error("Weight param not found.");

            if (!(typeof userID === 'string')) throw new Error("Invalid UserID format.");
            if (!(typeof foodName === 'string')) throw new Error("Invalid FoodName format.");
            if ( !(typeof weight === 'number') || (!isFloat(weight) && !Number.isInteger(weight)) ) throw new Error("Invalid Weight format.");
        } catch (err) {
            console.log(err.message);
            res.status(400);
            return res.json({Error : err.message});
        }

        // Send to database and check for errors
        try {
            var result = await dbCom.addLog(userID, foodName, weight);
            console.log("Result:", result);

            if (result.rowCount == 0) {
                res.status(418);
                return res.json({});
            } else {
                res.status(201);
                res.send("Success");
            }           
        } catch (err) {
            console.log("Error:", err);
            res.status(500);
            return res.json({Error : err.detail});
        }
    }

    // GET REQUESTS
    async #getFoodTotalWeight(req, res) {
        var userID;
        var foodName;

        try {
            if (areWeTestingWithJest()) {
                if(!(userID = req.headers["UserID"])) throw new Error("UserID param not found.");
                if(!(foodName = req.headers["FoodName"])) throw new Error("FoodName param not found.");
            } else {
                if(!(userID = req.get("UserID"))) throw new Error("UserID param not found.");
                if(!(foodName = req.get("FoodName"))) throw new Error("FoodName param not found.");
            }

            if (!(typeof userID === 'string')) throw new Error("Invalid UserID format.");
            if (!(typeof foodName === 'string')) throw new Error("Invalid FoodName format.");
        } catch (err) {
            console.log(err.message);
            res.status(400);
            return res.json({Error : err.message});
        }

        // Send to database and check for errors
        try {
            var result = await dbCom.getWeight(userID, foodName);
            console.log("Result:", result);

            var weight = result.rows[0].sum;

            if (weight == null) {
                res.status(418);
                return res.json({});
            } else {
                res.status(201);
                res.json({
                    FoodName : foodName,
                    Weight : parseFloat(weight)
                });
            }           
        } catch (err) {
            console.log("Error:", err);
            res.status(500);
            return res.json({Error : err.detail});
        }
    }

    async #getHarvestLog(req, res) {
        var userID;

        try {
            if (areWeTestingWithJest()) {
                if(!(userID = req.headers["UserID"])) throw new Error("UserID param not found.");
            } else {
                if(!(userID = req.get("UserID"))) throw new Error("UserID param not found.");
            }

            if (!(typeof userID === 'string')) throw new Error("Invalid UserID format.");
        } catch (err) {
            console.log(err.message);
            res.status(400);
            return res.json({Error : err.message});
        }

        // Send to database and check for errors
        try {
            var result = await dbCom.getHarvestLogs(userID);
            console.log("Result:", result);

            if (result.rowCount == 0) {
                res.status(418);
                return res.json({});
            } else {
                res.status(201);
                res.json(result.rows);
            }           
        } catch (err) {
            console.log("Error:", err);
            res.status(500);
            return res.json({Error : err.detail});
        }
    }

    async #getAllFoodNames(req, res) {
        try {
            var result = await dbCom.getAllFood();
            console.log("Result:", result);

            if (result.rowCount == 0) {
                res.status(418);
                return res.json({});
            } else {
                res.status(201);
                res.json(result.rows);
            }           
        } catch (err) {
            console.log("Error:", err);
            res.status(500);
            return res.json({Error : err.detail});
        }
    }

    async #getFilteredLog(req, res) {
        var userID;
        var time;
        var period;
        var level;
        var produce;

        // Check all the header stuff
        try {
            if (areWeTestingWithJest()) {
                if(!(userID = req.headers["UserID"])) throw new Error("UserID param not found.");
                if(!(time = parseInt(req.headers["Time"]))) throw new Error("Time param not found.");
                if(!(period = req.headers["Period"])) throw new Error("Period param not found.");
                if(!(level = req.headers["Level"])) throw new Error("Level param not found.");
                if(!(produce = req.headers["Produce"])) throw new Error("Produce param not found.");
            } else {
                if(!(userID = req.get("UserID"))) throw new Error("UserID param not found.");
                if(!(time = parseInt(req.get("Time")))) throw new Error("Time param not found.");
                if(!(period = req.get("Period"))) throw new Error("Period param not found.");
                if(!(level = req.get("Level"))) throw new Error("Level param not found.");
                if(!(produce = req.get("Produce"))) throw new Error("Produce param not found.");
            }

            if (!(typeof userID === 'string')) throw new Error("Invalid UserID format.");
            if (!(typeof time === 'number') || !Number.isInteger(time))  throw new Error("Invalid Time format.");
            if (!(typeof period === 'string') || !["day", "month", "year"].includes(period.toLowerCase())) throw new Error("Invalid Period format.");
            if (!(typeof level === 'string') || !["foodname", "supertype", "type", "subtype", "superdupertype"].includes(level.toLowerCase())) throw new Error("Invalid Level format.");
            if (!(typeof produce === 'string')) throw new Error("Invalid Produce format.");

            level = level.toLowerCase()
            period = period.toLowerCase()
        } catch (err) {
            console.log(err.message);
            res.status(400);
            return res.json({Error : err.message});
        }

        if (level === "superdupertype") {
            var filteredResult = await filterSuperDuperType(res, userID, time, period);
        } else if (level === "supertype") {
            var filteredResult = await filterSuperType(res, userID, time, period, produce);
        } else if (level === "type") {
            var filteredResult = await filterType(res, userID, time, period, produce);
        } else if (level === "subtype") {
            var filteredResult = await filterSubType(res, userID, time, period, produce);
        } else if (level === "foodname") {
            var filteredResult = await filterFoodName(res, userID, time, period, produce);
        }
    }

    async #getAtlas(req, res) {
        var foodName;

        try {
            if (areWeTestingWithJest()) {
                if(!(foodName = req.headers["FoodName"])) throw new Error("FoodName param not found.");
            } else {
                if(!(foodName = req.get("FoodName"))) throw new Error("FoodName param not found.");
            }

            if (!(typeof foodName === 'string')) throw new Error("Invalid FoodName format.");
        } catch (err) {
            console.log(err.message);
            res.status(400);
            return res.json({Error : err.message});
        }

        // Send to database and check for errors
        try {
            var result = await dbCom.getAllAtlas(foodName);
            console.log("Result:", result);

            if (result.rowCount == 0) {
                res.status(418);
                return res.json({});
            } else {
                res.status(201);
                res.json(result.rows[0]);
            }           
        } catch (err) {
            console.log("Error:", err);
            res.status(500);
            return res.json({Error : err.detail});
        }
    }

    async #getLogsTotalWeight(req, res) {
        var userID;
        var foodName;

        try {
            if (areWeTestingWithJest()) {
                if(!(userID = req.headers["UserID"])) throw new Error("UserID param not found.");
                if(!(foodName = req.headers["FoodName"])) throw new Error("FoodName param not found.");
            } else {
                if(!(userID = req.get("UserID"))) throw new Error("UserID param not found.");
                if(!(foodName = req.get("FoodName"))) throw new Error("FoodName param not found.");
            }

            if (!(typeof userID === 'string')) throw new Error("Invalid UserID format.");
            if (!(typeof foodName === 'string')) throw new Error("Invalid FoodName format.");
        } catch (err) {
            console.log(err.message);
            res.status(400);
            return res.json({Error : err.message});
        }

        // Send to database and check for errors
        try {
            var result = await dbCom.getHarvestLogsTotalWeight(userID, foodName);
            console.log("Result:", result);

            if (result.rowCount == 0) {
                res.status(418);
                return res.json({});
            } else {
                res.status(201);
                res.json(result.rows[0]);
            }           
        } catch (err) {
            console.log("Error:", err);
            res.status(500);
            return res.json({Error : err.detail});
        }
    }

    async endClient() {
        await dbCom.endClient();
    }
}

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

async function filterSuperDuperType(res, userID, time, period) {
    try {
        var result = await dbCom.getLogsSuperDuperType(userID, time, period);
        console.log("Result:", result);

        if (result.rowCount == 0) {
            res.status(418);
            return res.json({});
        } else {
            res.status(201);
            var curDate = new Date();
            var rows = result.rows;
            var monthRows = new Object();

            // Calculate how many months we need to return
            var monthsRemaining = 0;
            if (period === "month") {
                monthsRemaining = time;
            } else if (period === "year") {
                monthsRemaining = time * 12;
            }

            // Add the names as objects
            for (let i = curDate.getMonth(); i >= 0; i--) {
                if (monthsRemaining == 0) break;
                monthsRemaining--;
                monthRows[monthNames[i]] = new Number(0);
            }

            if (monthsRemaining > 0) {
                for (let i = monthNames.length - 1; i >= monthNames.length - monthsRemaining; i--) {
                    if (i < 0) break;
                    monthRows[monthNames[i]] = new Number(0);
                }
            }

            // Count up the weights in months (that have any)
            rows.forEach(function(row) {
                var date = new Date(row.Date_Logged);
                var monthName = monthNames[date.getMonth()];
                var weight = parseFloat(row.Weight);

                monthRows[monthName] += weight;
            });

            res.json(monthRows);
        }           
    } catch (err) {
        console.log("Error:", err);
        res.status(500);
        return res.json({Error : err.detail});
    }
}

async function filterSuperType(res, userID, time, period, superType) {
    try {
        var result = await dbCom.getLogsSuperType(superType, userID, time, period);
        console.log("Result:", result);

        if (result.rowCount == 0) {
            res.status(418);
            return res.json({});
        } else {
            res.status(201);
            var curDate = new Date();
            var rows = result.rows;
            var monthRows = new Object();

            // Calculate how many months we need to return
            var monthsRemaining = 0;
            if (period === "month") {
                monthsRemaining = time;
            } else if (period === "year") {
                monthsRemaining = time * 12;
            }

            // Add the names as objects
            for (let i = curDate.getMonth(); i >= 0; i--) {
                if (monthsRemaining == 0) break;
                monthsRemaining--;
                monthRows[monthNames[i]] = new Number(0);
            }

            if (monthsRemaining > 0) {
                for (let i = monthNames.length - 1; i >= monthNames.length - monthsRemaining; i--) {
                    if (i < 0) break;
                    monthRows[monthNames[i]] = new Number(0);
                }
            }

            // Count up the weights in months (that have any)
            rows.forEach(function(row) {
                var date = new Date(row.Date_Logged);
                var monthName = monthNames[date.getMonth()];
                var weight = parseFloat(row.Weight);

                monthRows[monthName] += weight;
            });

            res.json(monthRows);
        }           
    } catch (err) {
        console.log("Error:", err);
        res.status(500);
        return res.json({Error : err.detail});
    }
}

async function filterType(res, userID, time, period, type) {
    try {
        var result = await dbCom.getLogsType(type, userID, time, period);
        console.log("Result:", result);

        if (result.rowCount == 0) {
            res.status(418);
            return res.json({});
        } else {
            res.status(201);
            var curDate = new Date();
            var rows = result.rows;
            var monthRows = new Object();

            // Calculate how many months we need to return
            var monthsRemaining = 0;
            if (period === "month") {
                monthsRemaining = time;
            } else if (period === "year") {
                monthsRemaining = time * 12;
            }

            // Add the names as objects
            for (let i = curDate.getMonth(); i >= 0; i--) {
                if (monthsRemaining == 0) break;
                monthsRemaining--;
                monthRows[monthNames[i]] = new Number(0);
            }

            if (monthsRemaining > 0) {
                for (let i = monthNames.length - 1; i >= monthNames.length - monthsRemaining; i--) {
                    if (i < 0) break;
                    monthRows[monthNames[i]] = new Number(0);
                }
            }

            // Count up the weights in months (that have any)
            rows.forEach(function(row) {
                var date = new Date(row.Date_Logged);
                var monthName = monthNames[date.getMonth()];
                var weight = parseFloat(row.Weight);

                monthRows[monthName] += weight;
            });

            res.json(monthRows);
        }           
    } catch (err) {
        console.log("Error:", err);
        res.status(500);
        return res.json({Error : err.detail});
    }
}

async function filterSubType(res, userID, time, period, subtype) {
    try {
        var result = await dbCom.getLogsSubType(subtype, userID, time, period);
        console.log("Result:", result);

        if (result.rowCount == 0) {
            res.status(418);
            return res.json({});
        } else {
            res.status(201);
            var curDate = new Date();
            var rows = result.rows;
            var monthRows = new Object();

            // Calculate how many months we need to return
            var monthsRemaining = 0;
            if (period === "month") {
                monthsRemaining = time;
            } else if (period === "year") {
                monthsRemaining = time * 12;
            }

            // Add the names as objects
            for (let i = curDate.getMonth(); i >= 0; i--) {
                if (monthsRemaining == 0) break;
                monthsRemaining--;
                monthRows[monthNames[i]] = new Number(0);
            }

            if (monthsRemaining > 0) {
                for (let i = monthNames.length - 1; i >= monthNames.length - monthsRemaining; i--) {
                    if (i < 0) break;
                    monthRows[monthNames[i]] = new Number(0);
                }
            }

            // Count up the weights in months (that have any)
            rows.forEach(function(row) {
                var date = new Date(row.Date_Logged);
                var monthName = monthNames[date.getMonth()];
                var weight = parseFloat(row.Weight);

                monthRows[monthName] += weight;
            });

            res.json(monthRows);
        }           
    } catch (err) {
        console.log("Error:", err);
        res.status(500);
        return res.json({Error : err.detail});
    }
}

async function filterFoodName(res, userID, time, period, foodName) {
    try {
        var result = await dbCom.getLogsFoodNameType(foodName, userID, time, period);
        console.log("Result:", result);

        if (result.rowCount == 0) {
            res.status(418);
            return res.json({});
        } else {
            res.status(201);
            var curDate = new Date();
            var rows = result.rows;
            var monthRows = new Object();

            // Calculate how many months we need to return
            var monthsRemaining = 0;
            if (period === "month") {
                monthsRemaining = time;
            } else if (period === "year") {
                monthsRemaining = time * 12;
            }

            // Add the names as objects
            for (let i = curDate.getMonth(); i >= 0; i--) {
                if (monthsRemaining == 0) break;
                monthsRemaining--;
                monthRows[monthNames[i]] = new Number(0);
            }

            if (monthsRemaining > 0) {
                for (let i = monthNames.length - 1; i >= monthNames.length - monthsRemaining; i--) {
                    if (i < 0) break;
                    monthRows[monthNames[i]] = new Number(0);
                }
            }

            // Count up the weights in months (that have any)
            rows.forEach(function(row) {
                var date = new Date(row.Date_Logged);
                var monthName = monthNames[date.getMonth()];
                var weight = parseFloat(row.Weight);

                monthRows[monthName] += weight;
            });

            res.json(monthRows);
        }           
    } catch (err) {
        console.log("Error:", err);
        res.status(500);
        return res.json({Error : err.detail});
    }
}

module.exports=stalkoverflow();

function isFloat(n){
    return Number(n) === n && n % 1 !== 0;
}

function areWeTestingWithJest() {
    return process.env.JEST_WORKER_ID !== undefined;
}