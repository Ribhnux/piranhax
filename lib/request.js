const Sign = require("./sign")

const url = require("url")
const request = require("request")
const parseString = require("xml2js").parseString
const _ = require("lodash")

const Service = "AWSECommerceService"
const Version = "2013-08-01"

// ValidOperation is list of operation currently supported by Amazon
const ValidOperation = ["ItemSearch","ItemLookup",
    "BrowseNodeLookup", "SimilarityLookup",
    "CartCreate", "CartAdd",
    "CartClear", "CartGet", "CartModify"]

const USER_AGENT = "Piranha"


const LOCALE = {
    "BR": "http://webservices.amazon.com.br/onca/xml",
    "CA": "http://webservices.amazon.ca/onca/xml",
    "CN": "http://webservices.amazon.cn/onca/xml",
    "DE": "http://webservices.amazon.de/onca/xml",
    "ES": "http://webservices.amazon.es/onca/xml",
    "FR": "http://webservices.amazon.fr/onca/xml",
    "IN": "http://webservices.amazon.in/onca/xml",
    "IT": "http://webservices.amazon.it/onca/xml",
    "JP": "http://webservices.amazon.co.jp/onca/xml",
    "MX": "http://webservices.amazon.com.mx/onca/xml",
    "UK": "http://webservices.amazon.co.uk/onca/xml",
    "US": "http://webservices.amazon.com/onca/xml"
}

class Request {
    constructor(AccessKeyId, SecretKey, AssociateTag) {
        this.userAgent = USER_AGENT
        this.Endpoint = LOCALE["US"]
        this.AccessKeyId = AccessKeyId
        this.SecretKey = SecretKey
        this.AssociateTag = AssociateTag
    }

    setLocale(locale) {
        if (LOCALE[locale]) {
            this.Endpoint = LOCALE[locale]
        } else {
            this.Endpoint = LOCALE["US"]
        }
    }

    // format response group
    _responseGroup() {
        let RG = this.Parameter.ResponseGroup
        delete this.Parameter.ResponseGroup

        let responseGroup = []
        for (var x in RG) {
            responseGroup.push(RG[x])
        }

        return responseGroup
    }

    // add timestamp to query
    _addTimestamp(query) {
        var currentdate = new Date()

        // set timestamp, backup and delete old objects
        if (!this.Parameter.Timestamp) {
            query.Timestamp = currentdate.toISOString() //moment.utc().format()
        } else {
            query.Timestamp = this.Parameter.Timestamp
        }
        delete this.Parameter.Timestamp
        return query
    }

    // assign parameter to query
    _assignParameter(query) {
        // add parameter to query
        for (var y in this.Parameter) {
            let params = this.Parameter[y]
            if (Array.isArray(params)) {
                params = params.join(",")
            }

            // replace . with dot for backup
            y = _.replace(y, /\./ig, "dot")

            // add param name
            let paramName = _.startCase(y)
                .replace(/\s/gi, "")
                .replace(/Dot/ig, ".")
            query[paramName] = params
        }
        return query
    }

    _signURL(urlObject, query) {
        urlObject.query = query
        let signature = new Sign(urlObject.format(), this.SecretKey)

        // add signature to query
        let q = signature.rejoinedQuery()
        q.Signature = signature.calculate()

        return q
    }

    // format URL of request
    _formatURL() {
        let urlObject = url.parse(this.Endpoint)
        let responseGroup = this._responseGroup()

        //  define query
        let query = {
            Version, Service,
            Operation: this.Operation,
            AWSAccessKeyId: this.AccessKeyId,
            AssociateTag: this.AssociateTag
        }

        if (responseGroup.length > 0) {
            query.ResponseGroup = responseGroup.join(",")
        }

        // set timestamp, backup and delete old objects
        query = this._addTimestamp(query)
        query = this._assignParameter(query)

        // sign urlObject
        urlObject.query = this._signURL(urlObject, query)

        // set finalURL
        this.finalURL = urlObject.format()
    }

    // get signed URL
    signedURL() {
        return this.finalURL
    }

    _isValid(result) {
        let responseName = this.Operation + "Response"
        let valid = true

        if (typeof result[responseName] === "undefined") {
            return valid
        }


        switch(this.Operation) {
        case "ItemSearch":
        case "ItemLookup":
            valid = typeof _.get(result, responseName +
                ".Items.Request.Errors") == "undefined"
            break
        case "BrowseNodeLookup":
            valid = typeof _.get(result, responseName +
                ".BrowseNodes.Request.Errors") === "undefined"
            break
        case "SimilarityLookup":
            valid = typeof _.get(result, responseName +
                ".Similarity.Request.Errors") === "undefined"
            break
        case "CartCreate":
        case "CartGet":
        case "CartAdd":
        case "CartModify":
        case "CartClear":
            valid = typeof _.get(result, responseName + ".Cart.Request.Errors")
                === "undefined"
            break
        }
        return valid
    }

    setUserAgent(ua) {
        this.userAgent = ua
    }


    // fetch data from endpoint
    fetch(operation, parameter) {
        this.Operation = operation
        this.Parameter = parameter || {}

        // format url
        this._formatURL()

        return new Promise((resolve, reject) => {
            if (ValidOperation.indexOf(operation) == -1) {
                //let err = new Error("Invalid operation")
                //return callback(err, null)
                return reject(new Error("Invalid operation"))
            }

            let options = {
                url: this.finalURL,
                headers: {
                    "User-Agent": this.userAgent
                },
                strictSSL: false
            }


            request(options, (err, response, xml) => {
                // check error
                if (err) {
                    let e = new Error(err.message + "\nURL: " + this.finalURL)
                    return reject(new Error(e))
                }

                // parse xml string
                parseString(xml, {explicitArray: false}, (err, result) => {
                    if (err) {
                        let e = new Error(err.message + "\nURL: " + this.finalURL)
                        return reject(e)
                    }

                    // check status code
                    if (response.statusCode !== 200) {
                        let e = new Error("StatusCode is not OK.\nURL: " + this.finalURL)
                        return reject(e)
                    }

                    if (this._isValid(result) === false) {
                        let e = new Error("Response is invalid.\nURL: " + this.finalURL)
                        //result.URL = this.finalURL
                        return reject(e)
                    }

                    //let Response = _.get(result, this.Operation + "Response")
                    //Response.URL = this.finalURL
                    let resp = new Response(this.Operation, result)
                    return resolve(resp)
                })
            })
        })
    }
}

class Response {
    constructor(operation, data) {
        this.setMainData(operation)
        this._rawData = data
        this._data = _.get(data, operation + "Response")
    }

    setMainData(operation) {
        switch(operation) {
        case "ItemSearch":
        case "ItemLookup":
        case "SimilarityLookup":
            this._mainRootPath = "Items"
            break
        case "BrowseNodeLookup":
            this._mainRootPath = "BrowseNodes"
            break
        case "CartCreate":
        case "CartGet":
        case "CartAdd":
        case "CartModify":
        case "CartClear":
            this._mainRootPath = "Cart"
            break
        }
    }

    OperationRequest() {
        return _.get(this._rawData, "OperationRequest")
    }

    Request() {
        return this.get("Request")
    }

    data() {
        return _.get(this._data, this._mainRootPath)
    }

    raw() {
        return this._rawData
    }

    get(path, _default) {
        // if path is not set
        if (!path) {
            return this.data()
        }

        // if default not set
        if (_default) {
            return _.get(this.data(), path, _default)
        }

        // if set all
        return _.get(this.data(), path)
    }
}

module.exports = Request
