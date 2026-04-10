import SurveyService from "../services/survey.service.js";

export const createSurvey = async (req, res, next) => {
    try{
        const id = req.user.id;
        const { title, description } = req.body;
        const result = await SurveyService.createSurvey(id, title, description);
        res.json(result);
    } catch (err) {
        next(err);
    }
}

export const getSurveyById = async (req, res, next) => {
    try {
        const survey_id = req.params;
        const result = await SurveyService.getSurveyById(survey_id);
        res.json(result);
    } catch (error) {
        next(error)
    }
}

export const getSurveyByUserId = async (req, res, next) => {
    try {
        const id = req.user.id;
        const result = await SurveyService.getSurveyByUserId(id);
        res.json(result);
    } catch (error) {
        next(error)
    }
}

export const deleteSurveyById = async (req, res, next) => {
    try{
        const survey_id = req.params;
        const id = req.user.id;
        const result = await SurveyService.deleteSurvey(survey_id, id)
        res.json(result);
    } catch (err) {
        next(err);
    }
}