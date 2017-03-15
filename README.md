# Piranhax

When the inhabitant creature wants to survive in the jungle.

[![NPM](https://nodei.co/npm/piranhax.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/piranhax/)

[![npm version](https://badge.fury.io/js/piranhax.svg)](https://www.npmjs.com/package/piranhax)
[![Build Status](https://travis-ci.org/Ribhnux/piranhax.svg?branch=master)](https://travis-ci.org/Ribhnux/piranhax)

## Introduction Piranhax

Piranhax is Node.js package that provides complete implementation of __Amazon Product Advertising API__. It supports all of operation from schema.

- ItemSearch
- ItemLookup
- BrowseNodeLookup
- SimilarityLookup
- CartCreate
- CartGet
- CartAdd
- CartModify
- CartClear

Also, Piranhax only support ES6 Promise right now (not callback).

Piranhax dependencies are [xml2js](https://www.npmjs.com/package/xml2js) for convert xml to JSON, and [lodash](https://lodash.com/) for ability to get nested object.

## Why is called Piranhax not Piranha?
Because npm only allow unique package name. There is a package named piranha.


## Getting Started

Piranhax need the latest Node.js that supports ES6, you can check that capability requirements with [node.green]((https://babeljs.io/docs/usage/require/)). Or if you still wanna use older version, you can use it with [babel-register](https://babeljs.io/docs/usage/require/).

First, install Piranhax:

```
npm install piranhax --save
```

# How to Use

After you install the package. You can include ```Piranhax``` within your code such this:

```javascript
const Piranhax = require("piranhax")
```

## Create client
All API operations can be used through a client. So we need to create a Piranhax client. It takes 3 parameters:

- AWSAccessKeyId
- SecretKey
- AssociateTag

```javascript
const client = new Piranhax("Your AWSAccessKeyId", "Your SecretKey", "Your AssociateTag")
```

To get that credentials, read :
- [http://docs.aws.amazon.com/AWSECommerceService/latest/DG/RequiredParameters.html](http://docs.aws.amazon.com/AWSECommerceService/latest/DG/RequiredParameters.html)
- [http://docs.aws.amazon.com/AWSECommerceService/latest/DG/becomingDev.html](http://docs.aws.amazon.com/AWSECommerceService/latest/DG/becomingDev.html)

## ItemSearch

The ItemSearch operation searches for items on Amazon. The Product Advertising API returns up to ten items per search results page.

See [http://docs.aws.amazon.com/AWSECommerceService/latest/DG/ItemSearch.html](http://docs.aws.amazon.com/AWSECommerceService/latest/DG/ItemSearch.html) for further information

Example:
```javascript
client.ItemSearch("Books", {
    Keywords: "Calculus"
}).then(results => {
    // results is a response object, see below for further information.
    console.log(results.data())

    // get first item ASIN
    console.log(results.get("Item[0].ASIN"))
}).catch(err => {
    console.log("Why error?", err)
})
```

The ```ItemSearch``` takes 2 arguments:
- __SearchIndex__: in the example code above, ```Books``` is a search index
- (optional) Key-value pairs of request parameters for example:
  ```
  {
      Keywords: "Calculus",
      ResponseGroup: ["Large"]
  }
  ```

## ItemLookup

Given an Item identifier, the ItemLookup operation returns some or all of the item attributes, depending on the response group specified in the request

See [http://docs.aws.amazon.com/AWSECommerceService/latest/DG/ItemLookup.html](http://docs.aws.amazon.com/AWSECommerceService/latest/DG/ItemLookup.html)  for further information.

Example:
```javascript
// below codes will get Kindle Voyage
let ASIN = "B00IOY8XWQ"
client.ItemLookup(ASIN, {
    ResponseGroup: ["Large"]
}).then(result => {
    // result is a response object
    // get item ASIN
    let ItemASIN = result.get("Item.ASIN")
}).catch(err => {
    console.log(err)
})

// note: you can use two ASIN
```

The ```ItemLookup``` operation takes 2 arguments:
- __Item ID__: in the example code above, it uses ASIN as an ID which is ```B00IOY8XWQ```
- (Optional) Key-value pairs of request parameters for example:
  ```
  {
      ResponseGroup: ["Large"]
  }
  ```


## BrowseNodeLookup

Given a browse node ID, BrowseNodeLookup returns the specified browse node’s name, children, and ancestors.

See [http://docs.aws.amazon.com/AWSECommerceService/latest/DG/BrowseNodeLookup.html](http://docs.aws.amazon.com/AWSECommerceService/latest/DG/BrowseNodeLookup.html) for further information.

Example:

```javascript
// set BrowseNodeId to 1000 which is books
let BrowseNodeId = 1000

// call BrowseNodeLookup operation
client.BrowseNodeLookup(BrowseNodeId).then(result => {
    // get browsenode id
    let NodeId = result.get("BrowseNode.BrowseNodeId")
    console.log(NodeId)

    // or if you wanna print the entire results, go with data
    let data = result.data()
    console.log(JSON.stringify(data))
}).catch(err => {
    console.log(err)
})
```
The ```BrowseNodeLookup``` takes 2 arguments:
- __NodeId__: is an integer represents an id of a node. In the example code above NodeId is 1000
- (Optional) Key-value pairs of request parameters

## SimilarityLookup

The SimilarityLookup operation returns up to ten products per page that are similar to one or more items specified in the request.

See [http://docs.aws.amazon.com/AWSECommerceService/latest/DG/SimilarityLookup.html](http://docs.aws.amazon.com/AWSECommerceService/latest/DG/SimilarityLookup.html) for further information

```javascript
client.ItemSearch("Books", {
    Keywords: "Universe"
}).then(results => {
    // get ASIN item in items
    let firstBookASIN = results.get("Item[0].ASIN", 0)

    // get similarity
    return client.SimilarityLookup(firstBookASIN)
}).then(result => {
    // check existence of ASIN
    let ASIN = result.get("Item[0].ASIN", 0)

    console.log(ASIN, result.data())
}).catch(err => {
    console.log(err)
})
```
The ```SimilarityLookup``` operation takes 2 arguments:
- __ASIN__
- (optional) Key-value pairs of request parameters.

## CartCreate

The CartCreate operation enables you to create a remote shopping cart.

See [http://docs.aws.amazon.com/AWSECommerceService/latest/DG/CartCreate.html](http://docs.aws.amazon.com/AWSECommerceService/latest/DG/CartCreate.html) for further information.

Example:
```javascript
const _ = require("lodash")

client.ItemSearch("Books", {
    Keywords: "Calculus",
    ResponseGroup: ["Large"]
})
.then(results => {
    let Item = results.get("Item")
    let OfferListingIds = _.map(Item, i =>
        _.get(i, "Offers.Offer.OfferListing.OfferListingId"))
        .filter(i => i !== undefined)

    // map OfferListingId
    let AddToCartItems = _.map(OfferListingIds, id => {
        let item = client.CreateCartItem("OfferListingId", id, 1)
        return item
    })

    // create request
    return client.CartCreate(AddToCartItems)
})
.then(result => {
    // get CartId
    let CartId = result.get("CartId")

    // get HMAC and one of CartItemId
    let HMAC = result.get("HMAC")
    let CartItemId = result.get("CartItems.CartItem[0].CartItemId")
}).end(err => {
    console.log(err)
})

```

The ```CartCreate``` operation takes 2 arguments:
- __CartItems__ is array of ```CartItem```
- (optional) Key-value pairs of request parameters.


## CartGet

The CartGet operation enables you to retrieve the IDs, quantities, and prices of all of the items, including SavedForLater items in a remote shopping cart.

See [http://docs.aws.amazon.com/AWSECommerceService/latest/DG/CartGet.html](http://docs.aws.amazon.com/AWSECommerceService/latest/DG/CartGet.html) for further information.

For example:
```javascript
client.CartGet(CartId, CartItemId, HMAC).then(result => {
    let cartId = result.get("CartId")
    let hmac = result.get("HMAC")
}).catch(err => {
    console.log(err)
})
```

The ```CartGet``` operation takes 4 arguments:
- __CartId__ is from Cart operation response ```result.get("CartId")```
- __HMAC__ is from Cart operation response  ```result.get("HMAC")```
- __CartItemId__ is from Cart operation response ```result.get("CartItems.CartItem[0].CartItemId")```
- (optional) Key-value pairs of request parameters, see ```ItemSearch``` operation:

## CartAdd

The CartAdd operation enables you to add items to an existing remote shopping cart.

See [http://docs.aws.amazon.com/AWSECommerceService/latest/DG/CartAdd.html](http://docs.aws.amazon.com/AWSECommerceService/latest/DG/CartAdd.html) for further information.

Example:
```javascript
const _ = require("lodash")

client.ItemSearch("Books", {
    Keywords: "Topology",
    ResponseGroup: ["Large"]
}).then(result => {
    let Item = result.get("Item")
    let OfferListingIds = _.map(Item,
        i => _.get(i, "Offers.Offer.OfferListing.OfferListingId"))
        .filter(i => i !== undefined)

    // map OfferListingId
    let AddItems = _.map(OfferListingIds, id => {
        let item = client.CreateCartItem("OfferListingId", id, 1)
        return item
    })

    // just select 2 of them
    AddItems = AddItems.slice(0, 2)

    // CartAdd operation
    return client.CartAdd(AddItems, CartId, HMAC)
}).catch(err => {
    console.log(err)
})
```
The ```CartAdd``` operation takes 4 arguments:
- __CartItems__ is array of ```CartItem```
- __CartId__ is from Cart operation response ```result.get("CartId")```
- __HMAC__ is from Cart operation response  ```result.get("HMAC")```
- (optional) Key-value pairs of request parameters, see ```ItemSearch``` operation:


## CartModify

The CartModify operation enables you to change the quantity of items that are already in a remote shopping cart and move items from the active area of a cart to the SaveForLater area or the reverse.

See [http://docs.aws.amazon.com/AWSECommerceService/latest/DG/CartModify.html](http://docs.aws.amazon.com/AWSECommerceService/latest/DG/CartModify.html) for further information.

Example:
```javascript

client.CartAdd(Items, CartId, HMAC).then(result => {
    // get CartItems size
    let c = result.get("CartItems.CartItem").length


    let CartItem = client.CreateCartItem("CartItemId",
        result.get("CartItems.CartItem[0].CartItemId"), 3)

    // get CartId
    let CartId = result.get("CartId")

    // get HMAC and one of CartItemId
    let HMAC = result.get("HMAC")

    // do CartModify operation
    return client.CartModify([CartItem], CartId, HMAC)
}).then(result => {
    let CartId = result.get("CartId")
    let HMAC = result.get("HMAC")
}).catch(err => {
    console.log(err)
})

```

The ```CartModify``` takes 4 arguments:
- __CartItems__ is array of ```CartItem```, for ```CartModify``` uses CartItemId as id
- __CartId__ is from Cart operation response ```result.get("CartId")```
- __HMAC__ is from Cart operation response  ```result.get("HMAC")```
- (optional) Key-value pairs of request parameters, see ```ItemSearch``` operation:


## CartClear

The CartClear operation enables you to remove all of the items in a remote shopping cart, including SavedForLater items.

See [http://docs.aws.amazon.com/AWSECommerceService/latest/DG/CartClear.html](http://docs.aws.amazon.com/AWSECommerceService/latest/DG/CartClear.html) for further information.

Example:
```javascript
client.CartClear(CartId, HMAC).then(result => {
    console.log(result.data())
}).catch(err => {
    console.log(err)
})
```

The ```CartClear``` takes 3 arguments:
- __CartId__ is from Cart operation response ```result.get("CartId")```
- __HMAC__ is from Cart operation response  ```result.get("HMAC")```
- (optional) Key-value pairs of request parameters, see ```ItemSearch``` operation:


## CreateCartItem

Create a CartItem used for all of Cart operation. See all of cart operation example above.
```javascript
client.CreateCartItem("OfferListingId", id, 1)
```

```CreateCartItem``` takes 3 arguments:
- __type__ type of CartItem's id
- __id__ of CartItem
- __qty__ is quantity of Item.


## Response

All promise resolve with ```Response``` object. With this object, we can use the following methods:

### response.get(path)
Get nested data from object using dot. For example:
```javascript
result.get("Item[0].ItemLinks.ItemLink.Description")
```
### response.data()

Get the main data from response.
```javascript
let data = result.data()
console.log(JSON.stringify(data))
```

### response.raw()

Raw will returns raw object instead the main.

### response.OperationRequest()

Get the OperationRequest object.

### response.Request()

Get Request object from main data.

# Documentation

~~For complete API documentation you can read here~~: __(WIP)__

# TODO

- add logo
- create a comprehensive tutorial
- generate complete API documentation for gh-pages
- create examples directory

# Contributing

Before submit pull request. Make sure you install devDependencies

Turn off production
```
npm config set -g production false
```

Install devDependencies
```
npm install
```

Install [ava](https://github.com/avajs/ava), and run
```
npm test
```

# License

See __LICENSE__ file
