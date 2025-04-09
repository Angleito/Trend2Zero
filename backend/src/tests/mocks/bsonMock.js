// Mock implementation of BSON
class ObjectId {
    constructor(id) {
        this.id = id || 'mock_object_id';
    }

    toString() {
        return this.id;
    }

    toHexString() {
        return this.id;
    }

    equals(other) {
        if (!other) return false;
        return this.toString() === other.toString();
    }

    static isValid(id) {
        return typeof id === 'string' || id instanceof String || id instanceof ObjectId;
    }

    static createFromHexString(hexString) {
        return new ObjectId(hexString);
    }

    static createFromTime(time) {
        return new ObjectId(time.toString());
    }

    getTimestamp() {
        return new Date();
    }
}

class BSON {
    static serialize(doc) {
        return Buffer.from(JSON.stringify(doc));
    }

    static deserialize(buffer) {
        return JSON.parse(buffer.toString());
    }
}

// Export the mock
module.exports = {
    ObjectId,
    BSON,
    // Add other BSON types if needed
    Binary: function(buffer) {
        return {
            buffer: buffer,
            length: buffer ? buffer.length : 0,
            sub_type: 0
        };
    },
    Code: function(code, scope) {
        return { code, scope };
    },
    DBRef: function(namespace, oid, db) {
        return { namespace, oid, db };
    },
    Decimal128: function(bytes) {
        return { bytes };
    },
    Double: function(value) {
        return { value };
    },
    Int32: function(value) {
        return { value };
    },
    Long: function(low, high) {
        return { low, high };
    },
    Map: function() {
        return new Map();
    },
    MaxKey: function() {
        return { MAX_KEY: true };
    },
    MinKey: function() {
        return { MIN_KEY: true };
    },
    Timestamp: function(low, high) {
        return { low, high };
    }
};