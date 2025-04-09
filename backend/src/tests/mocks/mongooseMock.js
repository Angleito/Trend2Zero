const mongoose = jest.requireActual('mongoose');

// Mock ObjectId
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
}

// Create mock Schema class
class Schema {
    constructor(definition, options) {
        this.definition = definition;
        this.options = options;
        this.methods = {};
        this.statics = {};
        this.virtuals = {};
        this.indexes = [];
    }

    method(name, fn) {
        this.methods[name] = fn;
        return this;
    }

    static(name, fn) {
        this.statics[name] = fn;
        return this;
    }

    virtual(name) {
        this.virtuals[name] = {
            get: function() {},
            set: function() {}
        };
        return this.virtuals[name];
    }

    pre() {
        return this;
    }

    post() {
        return this;
    }

    index(fields, options = {}) {
        this.indexes.push({ fields, options });
        return this;
    }
}

// Create mock connection
const connection = {
    collections: {},
    models: {},
    dropDatabase: jest.fn().mockResolvedValue(true),
    close: jest.fn().mockResolvedValue(true),
    collection: jest.fn().mockReturnValue({
        deleteMany: jest.fn().mockResolvedValue({ deletedCount: 0 }),
        createIndex: jest.fn().mockResolvedValue('index_name')
    })
};

// Create mock model class
class Model {
    constructor(data) {
        Object.assign(this, data);
    }

    save() {
        return Promise.resolve(this);
    }

    static find() {
        return {
            exec: () => Promise.resolve([]),
            sort: () => this.find(),
            limit: () => this.find(),
            skip: () => this.find(),
            select: () => this.find()
        };
    }

    static findOne() {
        return {
            exec: () => Promise.resolve(null),
            select: () => this.findOne()
        };
    }

    static findById() {
        return {
            exec: () => Promise.resolve(null),
            select: () => this.findById()
        };
    }

    static updateOne() {
        return Promise.resolve({ nModified: 1 });
    }

    static deleteOne() {
        return Promise.resolve({ deletedCount: 1 });
    }

    static deleteMany() {
        return Promise.resolve({ deletedCount: 0 });
    }

    static create(data) {
        const instance = new this(data);
        return Promise.resolve(instance);
    }
}

// Export enhanced mongoose mock
const enhancedMongoose = {
    ...mongoose,
    Schema,
    Model,
    connection,
    Types: {
        ...mongoose.Types,
        ObjectId
    },
    model: jest.fn((name, schema) => {
        // Create a new model class that extends our base Model
        class MockModel extends Model {
            constructor(data) {
                super(data);
                // Add schema methods to the instance
                if (schema && schema.methods) {
                    Object.assign(this, schema.methods);
                }
            }
        }
        
        // Add schema statics to the class
        if (schema && schema.statics) {
            Object.assign(MockModel, schema.statics);
        }
        
        // Add base Model static methods
        Object.assign(MockModel, Model);
        
        // Create indexes if defined
        if (schema && schema.indexes) {
            schema.indexes.forEach(index => {
                connection.collection().createIndex(index.fields, index.options);
            });
        }
        
        // Store the model in our connection
        connection.models[name] = MockModel;
        
        return MockModel;
    }),
    connect: jest.fn().mockResolvedValue(connection),
    disconnect: jest.fn().mockResolvedValue(true)
};

module.exports = enhancedMongoose;