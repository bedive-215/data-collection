import ResponseService from "../services/response.service.js";

class ResponseController {

    // Start submit
    async startSurvey(req, res, next) {
        try {
            const { survey_id } = req.params;
            const user_id = req.user.id;

            const result = await ResponseService.startSurvey(user_id, survey_id);
            res.status(201).json(result);
        } catch (err) {
            next(err);
        }
    }
    
    // submit
    async submit(req, res, next) {
        try {
            if (!Array.isArray(req.body.answers)) {
                return res.status(400).json({ message: "Invalid answers format" });
            }
            const result = await ResponseService.submitSurvey(
                req.user.id,
                req.params.survey_id,
                req.body.answers
            );

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }

    
    
    // get answers by response id
    async getAnswers(req, res, next) {
        try {
            const result = await ResponseService.getAllAnswerByResponseId(
                req.user,
                req.params.response_id
            );
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    // update
    async update(req, res, next) {
        try {
            const result = await ResponseService.updateResponse(
                req.user.id,
                req.params.survey_id,
                req.body.answers
            );
            
            res.json(result);
        } catch (err) {
            next(err);
        }
    }
    
    // delete
    async delete(req, res, next) {
        try {
            const result = await ResponseService.deleteResponse(
                req.user.id,
                req.params.response_id,
            );
            
            res.json(result);
        } catch (err) {
            next(err);
        }
    }
    
    // get my response for a survey
    async getMyResponse(req, res, next) {
        try {
            const result = await ResponseService.getSurveySubmitByUserId(
                req.user.id,
                req.params.survey_id
            );
            res.json(result);
        } catch (err) {
            next(err);
        }
    }
    
    // get all my responses
    async getMyResponses(req, res, next) {
        try {
            const result = await ResponseService.getAllResponsesByUserId(
                req.user.id
            );
            res.json(result);
        } catch (err) {
            next(err);
        }
    }
    
    // admin: get response by user and survey
    async getUserResponse(req, res, next) {
        try {
            const result = await ResponseService.getSurveySubmitByUserId(
                req.params.id,
                req.params.survey_id
            );
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    // admin: get all responses of a user
    async getUserResponses(req, res, next) {
        try {
            const result = await ResponseService.getAllResponsesByUserId(
                req.params.id
            );
            res.json(result);
        } catch (err) {
            next(err);
        }
    }
}

export default new ResponseController();