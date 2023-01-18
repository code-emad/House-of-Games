const express = require('express');
const { getCategories, getReviews, getReviewById, getComByReviewId, postComment} = require('./controller') 
const app = express();

app.use(express.json())

app.get('/api/categories', getCategories)

app.get('/api/reviews', getReviews)

app.get('/api/reviews/:review_id', getReviewById)

app.get('/api/reviews/:review_id/comments', getComByReviewId)

app.post('/api/reviews/:review_id/comments', postComment)

//error handlers
app.use((request, response, next) => {
    response.status(404).send({msg: 'Invalid API path'})
})

app.use((error, request, response, next) => {
    if (error.status) {
    response.status(error.status).send(error.msg)
    }
    else {
        next(error)
    }
})

app.use((error, request, response, next) => {
if (error.code === '22P02') {
    response.status(400).send({msg: 'Not valid Review Id'})
}
else {
    next(error)
}
})

app.use((error, request, response, next) => {
    console.log(error)
    response.status(500).send({msg: "Internal Server Error"})
}) 




module.exports = app