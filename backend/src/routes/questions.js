import express from 'express';

import {

createQuestion,

answerQuestion,

getQuestions

} from '../controllers/questionController.js';


const router = express.Router();



router.post(
'/',
createQuestion
);



router.put(
'/:id/answer',
answerQuestion
);



router.get(
'/:productId',
getQuestions
);



export default router;
