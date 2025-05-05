const BlogPost = require('../models/blogPost');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getAllPosts = catchAsync(async (req, res) => {
    const posts = await BlogPost.find({ isPublished: true })
        .sort('-publishedAt')
        .select('title slug excerpt category author publishedAt');
    
    res.status(200).json({
        status: 'success',
        data: posts
    });
});

exports.getPostBySlug = catchAsync(async (req, res, next) => {
    const post = await BlogPost.findOne({ 
        slug: req.params.slug,
        isPublished: true 
    });

    if (!post) {
        return next(new AppError('No post found with that slug', 404));
    }

    res.status(200).json({
        status: 'success',
        data: post
    });
});

exports.createPost = catchAsync(async (req, res) => {
    const post = await BlogPost.create(req.body);
    
    res.status(201).json({
        status: 'success',
        data: post
    });
});

exports.updatePost = catchAsync(async (req, res, next) => {
    const post = await BlogPost.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
            new: true,
            runValidators: true
        }
    );

    if (!post) {
        return next(new AppError('No post found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: post
    });
});

exports.deletePost = catchAsync(async (req, res, next) => {
    const post = await BlogPost.findByIdAndDelete(req.params.id);

    if (!post) {
        return next(new AppError('No post found with that ID', 404));
    }

    res.status(204).json({
        status: 'success',
        data: null
    });
}); 