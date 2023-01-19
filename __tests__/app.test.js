const request = require('supertest')
const app = require('../app')
const db = require('../db/connection')
const seed = require('../db/seeds/seed')
const testData = require('../db/data/test-data/index')
const sorted = require('jest-sorted')

beforeEach(() => seed(testData));

afterAll(() => {db.end()})

describe('GET/api/categories', () => {
    test('should return a status code of 200', () => {
        return request(app).get('/api/categories').expect(200)
    });
    test('should return an array', () => {
        return request(app).get('/api/categories').then((response) => {
            expect(Array.isArray(response.body)).toBe(true)
        })
    });
    test('each element of array should contain key of slug + description', () => {
        return request(app).get('/api/categories').then((response) => {
            let resultArray = response.body

            expect(resultArray.length).toBe(4) 
            resultArray.forEach((category) => {
                expect(category).toHaveProperty("slug")
                expect(category).toHaveProperty("description")
            })
        })
    });
});

describe('Error Handler - Deals with api paths that does not exist', () => {
    test('resolves with 404: Not found, for routes that does not exist', () => {
        return request(app).get('/invalidAPI').expect(404).then((response) => {
            expect(response.body).toEqual({msg: 'Invalid API path'})
        })
    })
});

describe('GET/api/reviews', () => {
    test('should return a status code of 200', () => {
        return request(app).get('/api/reviews').expect(200)
    });
    test('should return an array', () => {
        return request(app).get('/api/reviews').then(({body}) => {
            expect(Array.isArray(body)).toBe(true)
        })
    });
    test('each element of the array should contain following properties', () => {
        return request(app).get('/api/reviews').then(({body}) => {
            expect(body.length).toBe(13)
            body.forEach((review) => {
                expect(review).toHaveProperty("owner" ,expect.any(String))
                expect(review).toHaveProperty("title" ,expect.any(String))
                expect(review).toHaveProperty("review_id" ,expect.any(Number))
                expect(review).toHaveProperty("category" ,expect.any(String))
                expect(review).toHaveProperty("review_img_url" ,expect.any(String))
                expect(review).toHaveProperty("created_at" ,expect.any(String))
                expect(review).toHaveProperty("votes" ,expect.any(Number))
                expect(review).toHaveProperty("designer" ,expect.any(String))
                expect(review).toHaveProperty("comment_count" ,expect.any(Number))
            })
        })
    });
    test('comment_count for review_id 2,3 = 3', () => {
        return request(app).get('/api/reviews').then(({body}) => {
            let review2 = body.find((review) => {return review.review_id === 2})
            let review3 = body.find((review) => {return review.review_id === 3})
            expect(review2.comment_count).toEqual(3)
            expect(review3.comment_count).toEqual(3)
        })
    });
    test('comment_count for other review ids (not 2,3) = 0', () => {
        return request(app).get('/api/reviews').then(({body}) => {
            let otherReviews = body.filter((review) => {return review.review_id !== 2 && review.review_id !== 3})
            otherReviews.forEach((review) => {
                expect(review.comment_count).toEqual(0)
            })
        })
    });
    test('date is ordered in desc order', () => {
        return request(app).get('/api/reviews').then(({body}) => {
            expect(body).toBeSortedBy('created_at', {descending: true})
        })
    });
});

describe('GET/api/reviews:review_id', () => {
    test('should return a status code of 200', () => {
        return request(app).get('/api/reviews/1').expect(200)
    });
    test('should contain the following keys', () => {
        return request(app).get('/api/reviews/1').then(({body}) => {
            expect(body).toHaveProperty("review_id", expect.any(Number))
            expect(body).toHaveProperty("title", expect.any(String))
            expect(body).toHaveProperty("review_body", expect.any(String))
            expect(body).toHaveProperty("designer", expect.any(String))
            expect(body).toHaveProperty("review_img_url", expect.any(String))
            expect(body).toHaveProperty("votes", expect.any(Number))
            expect(body).toHaveProperty("category", expect.any(String))
            expect(body).toHaveProperty("owner", expect.any(String))
            expect(body).toHaveProperty("created_at", expect.any(String))
        })
    });
    //error handling
    test('if id is valid but not found returns 404 ID not found', () => {
        return request(app).get('/api/reviews/14').expect(404).then(({text}) => {
            expect(text).toBe("Review Id not found")
        })
    });
    test('if ID is not valid, returns 400 Not valid ID', () => {
        return request(app).get('/api/reviews/cheese').expect(400).then(({body}) => {
            expect(body.msg).toBe("Not valid Review Id")
        })
    });
});

describe('GET/api/reviews/:review_id/comments', () => {
    test('should return a status code of 200 ', () => {
        return request(app).get('/api/reviews/2/comments').expect(200)
    });
    test('should return an array', () => {
        return request(app).get('/api/reviews/2/comments').then(({body}) => {
            expect(Array.isArray(body)).toEqual(true)
        })
    });
    test('each element in the array should contain the following keys', () => {
        return request(app).get('/api/reviews/2/comments').then(({body}) => {
            expect(body.length).toBe(3)
            body.forEach((comment) => {
                expect(comment).toEqual(
                    expect.objectContaining({
                       comment_id: expect.any(Number),
                       votes: expect.any(Number),
                       created_at: expect.any(String),
                       author: expect.any(String),
                       body: expect.any(String),
                       review_id: expect.any(Number)
                    })
                )
            })
        })
    });
    test('date is ordered in desc order', () => {
        return request(app).get('/api/reviews/2/comments').then(({body}) => {
            expect(body).toBeSortedBy('created_at', {descending: true})
        })
    });
    //error handling
    test('if id is valid but not found returns 404 ID not found', () => {
        return request(app).get('/api/reviews/14/comments').expect(404).then(({text}) => {
            expect(text).toBe("Review Id not found")
        })
    });
    test('if id is not valid, returns 400 not valid Id ', () => {
        return request(app).get('/api/reviews/cheese/comments').expect(400).then(({body}) => {
            expect(body.msg).toBe("Not valid Review Id")
        })
    });
    test('if id is valid but no comments found, return an empty array', () => {
        return request(app).get('/api/reviews/1/comments').expect(200).then(({body}) => {
            expect(body).toEqual([])
        })        
    });
});

describe('POST/api/reviews/:review_id/comments', () => {
    let validBody = {username: 'dav3rid', body: 'This game was not my cup of tea'}
    test('should return 201 when valid body is sent', () => {
        return request(app).post('/api/reviews/1/comments').send(validBody)
        .expect(201)
    });
    test('should return the posted comment', () => {
        return request(app).post('/api/reviews/1/comments').send(validBody)
        .then(({body}) => {
            expect(body).toHaveProperty('comment_id', 7)
            expect(body).toHaveProperty('body', 'This game was not my cup of tea')
            expect(body).toHaveProperty('review_id', 1)
            expect(body).toHaveProperty('author', 'dav3rid')
            expect(body).toHaveProperty('votes', 0)
            expect(body).toHaveProperty('created_at', expect.any(String))
        })
    });
    //error handling
    test('can take a send request with extra properties and ignore them as long as valid info is contained', () => {
    let validBodyWithExtraProperties = {username: 'dav3rid', body: 'This game was not my cup of tea', extra: "i'm an extra property"}    
        return request(app).post('/api/reviews/1/comments').send(validBodyWithExtraProperties)
        .expect(201)
        .then(({body}) => {
            expect(body).toHaveProperty('comment_id', 7)
            expect(body).toHaveProperty('body', 'This game was not my cup of tea')
            expect(body).toHaveProperty('review_id', 1)
            expect(body).toHaveProperty('author', 'dav3rid')
            expect(body).toHaveProperty('votes', 0)
            expect(body).toHaveProperty('created_at', expect.any(String))
        })
    });
    test('if id valid but not found returns 404 ID not found (valid body send)', () => {
        return request(app).post('/api/reviews/14/comments').send(validBody)
        .expect(404).then(({text}) => {
            expect(text).toBe("Review Id not found")
        })
    });
    test('if id is not valid, returns 400 not valid Id ', () => {
        return request(app).post('/api/reviews/cheese/comments').send(validBody)
        .expect(400).then(({body}) => {
            expect(body.msg).toBe("Not valid Review Id")
        })
    });
    test('if sent body does not contain username key, fails with 400 bad request', () => {
        return request(app).post('/api/reviews/1/comments').send({body: 'failed'})
        .expect(400).then(({body}) => {
            expect(body.msg).toBe("Bad Request - Invalid info sent")
        })
    });
    test('if sent body that does not contain body, fails with 400 bad request', () => {
        return request(app).post('/api/reviews/1/comments').send({username: 'dav3rid'})
        .expect(400).then(({body}) => {
            expect(body.msg).toBe("Bad Request - Invalid info sent")
        })
    });
    test('if sent body that does not have valid username, fails with 400 bad request', () => {
        return request(app).post('/api/reviews/1/comments').send({username: 'fakeAcc', body: 'This game was not my cup of tea'})
        .expect(400).then(({body}) => {
            expect(body.msg).toBe("Bad Request - Invalid info sent")
        })
    });
});

describe.only('PATCH/api/reviews/:review_id', () => {
    const voteUp = {inc_votes: 10}
    const voteDown = {inc_votes: -10}
    test('should return a code of 200 when a valid body is sent', () => {
        return request(app).patch('/api/reviews/1').send(voteUp)
        .expect(200)
    });
    test('returns the updated review', () => {
        return request(app).patch('/api/reviews/1').send(voteUp)
        .then(({body}) => {
            expect(body).toHaveProperty('review_id', 1)
            expect(body).toHaveProperty('title', expect.any(String))
            expect(body).toHaveProperty('category', expect.any(String))
            expect(body).toHaveProperty('designer', expect.any(String))
            expect(body).toHaveProperty('owner', expect.any(String))
            expect(body).toHaveProperty('review_body', expect.any(String))
            expect(body).toHaveProperty('review_img_url', expect.any(String))
            expect(body).toHaveProperty('created_at', expect.any(String))
            expect(body).toHaveProperty('votes', 11)
        })
    });
    test('can take a a vote down that will take votes below 0', () => {
        return request(app).patch('/api/reviews/1').send(voteDown)
        .then(({body}) => {
            expect(body).toHaveProperty('votes', -9)
        })
    });
    //error handling
    test('if id valid but not found, returns 404 ID not found (valid body sent', () => {
        return request(app).patch('/api/reviews/14').send(voteUp)
        .expect(404).then(({text}) => {
            expect(text).toBe("Review Id not found")
        })
    });
    test('if id not not valid, returns 400 not valid ID (valid body sent)', () => {
        return request(app).patch('/api/reviews/cheese').send(voteUp)
        .expect(400).then(({body}) => {
            expect(body.msg).toBe('Not valid Review Id')
        });
    });

});