import test from "ava"
const Piranhax = require("./index.js")
const _ = require("lodash")

const getCredentials = function() {
    let env = process.env
    return {
        AccessKeyId: env.AccessKeyId,
        SecretKey: env.SecretKey,
        AssociateTag: env.AssociateTag
    }
}

// Check whether Sign method is works or not
test.cb("Check Signed URL value", t => {
    let client = new Piranhax("AKIAIOSFODNN7EXAMPLE",
        "1234567890", "mytag-20")

    let expected = "http://webservices.amazon.com/onca/xml?AWSAccessKeyId=AKIAIOSFODNN7EXAMPLE&AssociateTag=mytag-20&ItemId=0679722769&Operation=ItemLookup&ResponseGroup=Images%2CItemAttributes%2COffers%2CReviews&Service=AWSECommerceService&Timestamp=2014-08-18T12%3A00%3A00Z&Version=2013-08-01&Signature=j7bZM0LXZ9eXeZruTqWm2DIvDYVUU3wxPPpp%2BiXxzQc%3D"

    client.ItemLookup("0679722769", {
        Timestamp: "2014-08-18T12:00:00Z",
        ResponseGroup: ["Images", "ItemAttributes", "Offers", "Reviews"]
    }).then(() => {
        t.pass()
        t.end()
    }).catch(e => {
        t.not(e, null)
        let url = e.message.split("\n")
        url = url[1].split(": ")
        url = url[1]
        t.not(url, null)
        t.is(url, expected)
        t.pass()
        t.end()
    })
})

//

// test ItemLookup
test.cb("ItemLookup", t => {
    // here is the real test
    let c = getCredentials()
    let client = new Piranhax(c.AccessKeyId, c.SecretKey, c.AssociateTag)

    var ASIN = "0679722769"
    client.ItemLookup(ASIN, {
        ResponseGroup: ["Images", "ItemAttributes", "Offers", "Reviews"]
    }).then(result => {
        // console.log(JSON.stringify(result.data()))
        t.truthy(result.data())
        t.is(result.get("Item.ASIN"), ASIN)
        t.pass()
        t.end()
    }).catch(e => {
        t.fail(e)
        t.end()
    })
})

// test ItemSearch
test.cb("ItemSearch", t => {
    // here is the real test
    let c = getCredentials()
    let client = new Piranhax(c.AccessKeyId, c.SecretKey, c.AssociateTag)

    client.ItemSearch("Books", {
        Keywords: "Universe"
    }).then(result => {
        t.truthy(result.data())
        t.is(result.get("Item").length > 0, true)
        t.pass()
        t.end()
    }).catch(e => {
        t.fail(e)
        t.end()
    })
})


// test BrowseNodeLookup
test.cb("BrowseNodeLookup", t => {
    // here is the real test
    let c = getCredentials()
    let client = new Piranhax(c.AccessKeyId, c.SecretKey, c.AssociateTag)
    // set BrowseNodeId to 1000 which is books
    let BrowseNodeId = 1000

    // call BrowseNodeLookup operation
    client.BrowseNodeLookup(BrowseNodeId).then(result => {
        t.truthy(result.data())
        t.is(result.get("BrowseNode.BrowseNodeId"), BrowseNodeId.toString())
        t.pass()
        t.end()
    }).catch(e => {
        t.fail(e)
        t.end()
    })
})

// test SimilarityLookup
test.cb("SimilarityLookup", t => {
    // here is the real test
    let c = getCredentials()
    let client = new Piranhax(c.AccessKeyId, c.SecretKey, c.AssociateTag)

    client.ItemSearch("Books", {
        Keywords: "Universe"
    }).then(results => {
        t.truthy(results)

        // get ASIN item in items
        let ASIN = results.get("Item[0].ASIN", 0)

        // validate that itemId is not 0
        t.not(ASIN, 0)

        // get similarity
        return client.SimilarityLookup(ASIN)
    }).then(result => {
        t.truthy(result)

        // check existence of ASIN
        let ASIN = result.get("Item[0].ASIN", 0)
        t.truthy(ASIN)

        // pass
        t.pass()
        t.end()
    }).catch(e => {
        t.fail(e)
        t.end()
    })
})

// test Cart Operation
test.cb("All cart operation", t => {
    let c = getCredentials()
    let client = new Piranhax(c.AccessKeyId, c.SecretKey, c.AssociateTag)

    // create global var here
    var CartId = ""
    var HMAC = ""
    var count = 0
    var amount = 0

    client.ItemSearch("Books", {
        Keywords: "Calculus",
        ResponseGroup: ["Large"]
    })
    .then(results => {
        let Item = results.get("Item")
        let OfferListingIds = _.map(Item, i =>
            _.get(i, "Offers.Offer.OfferListing.OfferListingId"))
            .filter(i => i !== undefined)

        t.is(Item.length > 0, true)

        // map OfferListingId
        let CheckoutItems = _.map(OfferListingIds, id => {
            let item = client.CreateCartItem("OfferListingId", id, 1)
            return item
        })

        // create request
        return client.CartCreate(CheckoutItems)
    })
    .then(result => {
        // update global CartId to Cart.CartId found on result
        CartId = result.get("CartId")
        // check whether CartId is exist and truthy or not
        t.truthy(CartId)

        // update global HMAC to HMAC in Cart result
        HMAC = result.get("HMAC")
        // check whether HMAC is truthy, exist or not
        t.truthy(HMAC)

        // update global count to items in cart
        count = result.get("CartItems.CartItem").length

        // get CartItemId
        let CartItemId = result.get("CartItems.CartItem[0].CartItemId")
        t.truthy(CartItemId)

        // store amount to global
        amount = result.get("CartItems.CartItem[0]")

        // CartGet Operation
        return client.CartGet(CartId, CartItemId, HMAC)
    })
    .then(result => {
        // get CartId from result
        let cartId = result.get("CartId")
        // check whether CartId is equal to global CartId or not
        t.is(cartId, CartId)

        // check HMAC from result
        let hmac = result.get("HMAC")
        // check whether HMAC is equal to its global or not
        t.is(hmac, HMAC)

        // get CartItems length from result
        let c = result.get("CartItems.CartItem").length
        // check whether count is still the same or not
        t.is(c, count)

        // find more items with different keywords
        return client.ItemSearch("Books", {
            Keywords: "Topology",
            ResponseGroup: ["Large"]
        })
    })
    .then(result => {
        let Item = result.get("Item")
        let OfferListingIds = _.map(Item,
            i => _.get(i, "Offers.Offer.OfferListing.OfferListingId"))
            .filter(i => i !== undefined)

        // check is item.length more than 0
        t.is(Item.length > 0, true)

        // map OfferListingId
        let AddItems = _.map(OfferListingIds, id => {
            let item = client.CreateCartItem("OfferListingId", id, 1)
            return item
        })

        // just select 2 of them
        AddItems = AddItems.slice(0, 2)

        // CartAdd operation
        return client.CartAdd(AddItems, CartId, HMAC)
    })
    .then(result => {
        // get CartItems size
        let c = result.get("CartItems.CartItem").length
        // check for the count, if 12 then pass
        t.is(c, 11)

        // set amount to global variable
        amount = result.get("SubTotal.Amount")

        let CartItem = client.CreateCartItem("CartItemId",
            result.get("CartItems.CartItem[0].CartItemId"), 3)
        //t.pass()1
        //t.end()
        // do CartModify operation
        return client.CartModify([CartItem], CartId, HMAC)
    })
    .then(result => {
        let CartItemId = result.get("Request.CartModifyRequest.Items.Item.CartItemId")
        t.truthy(CartItemId)
        t.is(result.get("HMAC"), HMAC)
        t.is(result.get("CartId"), CartId)

        return client.CartGet(CartId, CartItemId, HMAC)
    })
    .then(result => {
        let $amount = result.get("SubTotal.Amount")
        t.not($amount, amount)

        return client.CartClear(CartId, HMAC)
    })
    .then(result => {
        t.is(result.get("CartId"), CartId)
        t.is(result.get("HMAC"), HMAC)
        t.not(count, result.get("CartItems.Item"))
        t.pass()
        t.end()
    })
    .catch(e => {
        t.fail(e)
        t.end()
    })
})
