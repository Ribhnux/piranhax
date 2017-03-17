const Request = require("./lib/request")
const _ = require("lodash")

/**
 * @copyright Ribhararnus Pracutiar
 */

/**
 * Represent an Item that sent to a Cart
 */
class CartItem {
    /**
     * Create CartItem
     * @param  {string} type type of CartItem's id
     * @param  {string} id   id of CartItem
     * @param  {number} qty  the quantity of CartItem
     */
    constructor(type, id, qty) {
        this._type = type
        this.Id(id)
        this.Quantity(qty)
    }

    /**
     * Set CartItem's id
     * @param {string} id the ID of CartItem
     */
    Id(id) {
        switch(this._type) {
        case "ASIN":
            this.ASIN(id)
            break
        case "CartItemId":
            this.CartItemId(id)
            break
        case "ListItemId":
            this.ListItemId(id)
            break
        default:
        case "OfferListingId":
            this.OfferListingId(id)
            break
        }
    }

    /**
     * Set id to ASIN
     * @param {string} asin Amazon Standard Identification Number
     */
    ASIN(asin) {
        if (typeof asin !== "string") {
            throw new Error("ASIN or OfferListingId must be string")
        }

        // check ASIN length
        if (asin.length < 13) {
            throw new Error("Invalid ASIN")
        }

        this._id = asin.toString()
    }

    /**
     * Set id to OfferListingId
     * @param {string} id OfferListingId of an Amazon item
     */
    OfferListingId(id) {
        if (typeof id !== "string") {
            throw new Error("ASIN or OfferListingId must be string")
        }
        this._id = id.toString()
    }

    /**
     * Set id to CartItemId
     * @param {string} id CartItemId from Cart operations
     */
    CartItemId(id) {
        if (typeof id !== "string") {
            throw new Error("CartItemId must be string, it is returned by other Cart operation")
        }
        this._id = id.toString()
    }

    /**
     * Set CartItem parameter action
     * @param {string} name Action name. It's useful for CartModify operation.
     */
    Action(name) {
        switch(name) {
        case "MoveToCart":
            this._action = name
            break
        case "SaveForLater":
        default:
            this._action = name
            break
        }
    }

    // set quantity of item
    /**
     * Set quantity of CartItem
     * @param {number} qty represents Quantity of an Item
     */
    Quantity(qty) {
        qty = _.toInteger(qty)

        // allow to clear an item for cart
        if (qty < 0) {
            qty = 0
        }

        // set this data to CartItem
        this._quantity = qty
    }

    /**
     * Set ListItemId of an Item
     * @param {string} id represents of ListItemId
     */
    ListItemId(id) {
        this._id = id.toString()
    }

    /**
     * Set index of CartItem
     * @param {number} i represents an index number of an Item
     */
    setIndex(i) {
        this.index = i
    }

    /**
     * Convert all property to parameter
     * @return {Object} parameter object
     */
    toParameter() {
        let parameter = {}

        // quantity
        let quantityParam = ["Item", this.index, "Quantity"].join(".")
        parameter[quantityParam] = this._quantity

        // offer listing id or ASIN
        let key = ["Item", this.index, this._type].join(".")
        parameter[key] = this._id

        if (this._action) {
            let actionParam = ["Item", this.index, this._action].join(".")
            parameter[actionParam] = this._action
        }

        return parameter
    }

    /**
     * Test whether this CartItem is valid or not
     * @return {Boolean} valid status
     */
    isValid() {
        if (this._quantity < 0) {
            return false
        }

        return true
    }
}

/* Class represents array of CartItem */
class CartItems {
    /**
     * Create array of CartItem
     * @param  {Array.CartItem} items represents many of CartItem
     */
    constructor(items) {
        if (!_.isArray(items)) {
            let err = new Error("Items not array")
            throw err
        }
        this._items = items
    }

    /**
     * Validate an CartItem is valid or not
     * @param  {CartItem} item a single CartItem Object
     */
    validateItem(item) {
        if (!(item instanceof CartItem)) {
            let err = new Error("Item must a CartItem Object")
            throw new err
        }

        if (!item.isValid()) {
            let err = new Error(`One of required parameter must be set:
                - Item must have a Quantity value and it cannot zero.
                - Item must have OfferListingId or ASIN. (OfferListingId is preferred)`)
            throw new err
        }
    }

    /**
     * Convert CartItems to parameters
     * @param  {Object} parameter borrow from previous parameter.
     * @return {Object}           new parameter object.
     */
    toParameter(parameter) {
        parameter = parameter || {}
        for (let x in this._items) {
            // let item is x
            let Item = this._items[x]

            this.validateItem(Item)

            // set index of CartItem
            Item.setIndex(x)

            // apply parameter to p
            let param = Item.toParameter()
            for (let p in param) {
                parameter[p] = param[p]
            }
        }
        return parameter
    }
}

/**
 * Class representing a Piranhax client.
 * @extends Request
 */
class Piranhax extends Request {
    /**
     * Create a Piranhax Client
     * @param  {string} AccessKeyId  - An alphanumeric token that uniquely identifies a seller.
     * @param  {string} SecretKey    - It's Security Credentials. Pair of AccessKeyId
     * @param  {string} AssociateTag - An alphanumeric token that uniquely identifies an Associate.
     */
    constructor(AccessKeyId, SecretKey, AssociateTag) {
        super(AccessKeyId, SecretKey, AssociateTag)
    }


    /**
     * Set locale endpoint
     * @param {string} locale String represents supported locale by Amazon
     */
    setLocale(locale) {
        super.setLocale(locale)
    }

    /**
     * Set User-Agent request header
     * @param {string} ua User-agent name
     */
    setUserAgent(ua) {
        super.setUserAgent(ua)
    }


    /**
     * Create a CartItem using client method.
     * @param {string} type Type of CartItem
     * @param {string} id   Id of CartItem
     * @param {Number} qty  Quantity of CartItem
     */
    CreateCartItem(type, id, qty) {
        if (!id && !qty) {
            let err = new Error("id and quantity is required")
            throw err
        }
        return new CartItem(type, id, qty)
    }

    /**
     * The ItemSearch operation searches for items on Amazon. The Product Advertising API returns up to ten items per search results page.
     * @see {@link http://docs.aws.amazon.com/AWSECommerceService/latest/DG/ItemSearch.html} for further information.
     *
     * @param {string} SearchIndex  The product category to search.
     * @param {Object} parameter    Request parameters.
     * @return {Promise<Response|Error>}
     */
    ItemSearch(SearchIndex, parameter) {
        if (Object.keys(parameter).length <= 0) {
            let err = new Error("An ItemSearch request requires " +
                "a search index and the value for at least one parameter")

            return Promise.reject(err)
        }

        // apply SearchIndex in parameter
        parameter.SearchIndex = SearchIndex

        // create new request
        return super.fetch("ItemSearch", parameter)
    }

    /**
     * Given an Item identifier, the ItemLookup operation returns some or all of the item attributes, depending on the response group specified in the request
     * @see {@link http://docs.aws.amazon.com/AWSECommerceService/latest/DG/ItemLookup.html} for further information.
     *
     * @param {string} ItemId    SKU, UPC, EAN, ISBN or ASIN
     * @param {Object} parameter Request parameters.
     * @return {Promise<Response|Error>}
     */
    ItemLookup(ItemId, parameter) {
        parameter = parameter || {}

        // set item id from arguments
        parameter.ItemId = ItemId

        // create request
        return super.fetch("ItemLookup", parameter)
    }

    /**
     * BrowseNodeLookup operation.
     * Given a browse node ID, BrowseNodeLookup returns the specified browse node’s name, children, and ancestors.
     * The names and browse node IDs of the children and ancestor browse nodes are also returned.
     * BrowseNodeLookup enables you to traverse the browse node hierarchy to find a browse node.
     * @see {@link http://docs.aws.amazon.com/AWSECommerceService/latest/DG/BrowseNodeLookup.html} for further information.
     *
     * @param {Number} BrowseNodeId A positive integer assigned by Amazon that uniquely identifies a product category
     * @param {Object} parameter    Request parameters.
     * @return {Promise<Response|Error>}
     */
    BrowseNodeLookup(BrowseNodeId, parameter) {
        parameter = parameter || {}
        BrowseNodeId = parseInt(BrowseNodeId, 10)
        if (BrowseNodeId <= 0) {
            let err = new Error("Valid Values: A positive integer")
            return Promise.reject(err)
        }

        // set BrowseNodeId
        parameter.BrowseNodeId = BrowseNodeId

        // create new request
        return super.fetch("BrowseNodeLookup", parameter)
    }

    /**
     * The SimilarityLookup operation returns up to ten products per page that are similar to one or more items specified in the request
     * @see {@link http://docs.aws.amazon.com/AWSECommerceService/latest/DG/SimilarityLookup.html} for further information.
     *
     * @param {string} ItemId    An ItemId is an alphanumeric identifier assigned to an item / ASIN.
     * @param {Object} parameter Request parameters.
     * @return {Promise<Response|Error>}
     */
    SimilarityLookup(ItemId, parameter) {
        parameter = parameter || {}

        // set ItemId to parameter
        parameter.ItemId = ItemId

        // create request
        return super.fetch("SimilarityLookup", parameter)
    }

    /**
     * The CartCreate operation enables you to create a remote shopping cart
     * @see {@link http://docs.aws.amazon.com/AWSECommerceService/latest/DG/CartCreate.html} for further information.
     *
     * @param {CartItems} items         Array of CartItem
     * @param {Object}    parameter     Request parameters.
     *
     * @return {Promise<Response|Error>}
     */
    CartCreate(items, parameter) {
        // set default parameter with empty object
        parameter = parameter || {}

        let cartItems = new CartItems(items)
        parameter = cartItems.toParameter(parameter)

        return super.fetch("CartCreate", parameter)
    }

    /**
     * The CartGet operation enables you to retrieve the IDs,
     * quantities, and prices of all of the items,
     * including SavedForLater items in a remote shopping cart.
     * @see {@link http://docs.aws.amazon.com/AWSECommerceService/latest/DG/CartCreate.html} for further information.
     *
     * @param {string} CartId     Alphanumeric token returned by CartCreate that identifies a cart.
     * @param {string} CartItemId Alphanumeric token that uniquely identifies an item in a cart
     * @param {string} HMAC       The Hash Message Authentication Code is an encrypted alphanumeric token that is used to authenticate requests.
     * @param {Object} parameter  Request parameters.
     * @return {Promise<Response|Error>}
     */
    CartGet(CartId, CartItemId, HMAC, parameter) {
        parameter = parameter || {}
        parameter.CartId = CartId
        parameter.CartItemId = CartItemId
        parameter.HMAC = HMAC

        return super.fetch("CartGet", parameter)
    }

    /**
     * The CartAdd operation enables you to add items to an existing remote shopping cart.
     * @see {@link http://docs.aws.amazon.com/AWSECommerceService/latest/DG/CartAdd.html} for further information.
     *
     * @param {CartItems} items     Array of CartItem
     * @param {string} CartId       Alphanumeric token returned by CartCreate that identifies a cart.
     * @param {string} HMAC         The Hash Message Authentication Code is an encrypted alphanumeric token that is used to authenticate requests.
     * @param {Object} parameter    Request parameters.
     * @return {Promise<Response|Error>}
     */
    CartAdd(items, CartId, HMAC, parameter) {
        parameter = parameter || {}

        let cartItems = new CartItems(items)
        parameter = cartItems.toParameter(parameter)

        parameter.CartId = CartId
        parameter.HMAC = HMAC

        return super.fetch("CartAdd", parameter)
    }

    /**
     * The CartModify operation enables you to change the quantity of items that are already
     * in a remote shopping cart and move items from the active area of a cart to the SaveForLater area or the reverse.
     * @see {@link http://docs.aws.amazon.com/AWSECommerceService/latest/DG/CartModify.html} for further information.
     *
     * @param {CartItems} items     Array of CartItem
     * @param {string} CartId       Alphanumeric token returned by CartCreate that identifies a cart.
     * @param {string} HMAC         The Hash Message Authentication Code is an encrypted alphanumeric token that is used to authenticate requests.
     * @param {Object} parameter    Request parameters.
     * @return {Promise<Response|Error>}
     */
    CartModify(items, CartId, HMAC, parameter) {
        parameter = parameter || {}

        let cartItems = new CartItems(items)
        parameter = cartItems.toParameter(parameter)
        parameter.CartId = CartId
        parameter.HMAC = HMAC

        // fetch now
        return super.fetch("CartModify", parameter)
    }

    /**
     * The CartClear operation enables you to remove all of the items in a remote shopping cart, including SavedForLater items.
     * To remove only some of the items in a cart or to reduce the quantity of one or more items, use CartModify.
     * @see {@link http://docs.aws.amazon.com/AWSECommerceService/latest/DG/CartModify.html} for further information.
     *
     * @param {string} CartId       Alphanumeric token returned by CartCreate that identifies a cart.
     * @param {string} HMAC         The Hash Message Authentication Code is an encrypted alphanumeric token that is used to authenticate requests.
     * @param {Object} parameter    Request parameters.
     * @return {Promise<Response|Error>}
     */
    CartClear(CartId, HMAC, parameter) {
        parameter = parameter || {}
        parameter.CartId = CartId
        parameter.HMAC = HMAC

        // fetch now
        return super.fetch("CartClear", parameter)
    }
}

/**
 * Piranhax Client.
 * @module piranhax
 */
module.exports = Piranhax
