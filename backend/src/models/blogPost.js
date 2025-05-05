const mongoose = require('mongoose');

const blogPostSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'A blog post must have a title'],
        trim: true
    },
    slug: {
        type: String,
        required: [true, 'A blog post must have a slug'],
        unique: true,
        trim: true
    },
    excerpt: {
        type: String,
        trim: true
    },
    content: {
        type: String,
        required: [true, 'A blog post must have content']
    },
    category: {
        type: String,
        trim: true
    },
    author: {
        type: String,
        required: [true, 'A blog post must have an author']
    },
    publishedAt: {
        type: Date,
        default: Date.now
    },
    isPublished: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Create slug from title before saving
blogPostSchema.pre('save', function(next) {
    if (!this.isModified('title')) return next();
    this.slug = this.title.toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');
    next();
});

const BlogPost = mongoose.model('BlogPost', blogPostSchema);

module.exports = BlogPost; 