import ResponseService from "../services/response.service.js";

class ResponseController {
    // submit
    async submit(req, res, next) {
        try {
            const result = await ResponseService.submitSurvey(
                req.user?.id || null,
                req.params.survey_id,
                req.body.answers
            );

            res.status(201).json(result);
        } catch (err) {
            next(err);
        }
    }

    
    
    // get answers by response id
    async getAnswers(req, res, next) {
        try {
            const result = await ResponseService.getAllAnswerByResponseId(
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
                req.user.role === "admin"
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