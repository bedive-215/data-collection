import SectionService from "../services/section.service.js";
import { AppError } from "../middlewares/handleException.middlware.js";

class SectionController {

    async create(req, res, next) {
        try {
            const { survey_id } = req.params;
            const result = await SectionService.createSection(survey_id, req.body);
            return res.status(201).json(result);
        } catch (err) {
            next(err);
        }
    }

    async getBySurvey(req, res, next) {
        try {
            const { survey_id } = req.params;
            const result = await SectionService.getSectionsBySurvey(survey_id);
            return res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }

    async update(req, res, next) {
        try {
            const { section_id } = req.params;
            const result = await SectionService.updateSection(section_id, req.body);
            return res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }

    async delete(req, res, next) {
        try {
            const { section_id } = req.params;
            const result = await SectionService.deleteSection(section_id);
            return res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }

    async reorder(req, res, next) {
        try {
            const { survey_id } = req.params;
            const { sections } = req.body;
            if (!sections || !Array.isArray(sections)) {
                throw new AppError("sections must be an array of { id, order_index }", 400);
            }
            const result = await SectionService.reorderSections(survey_id, sections);
            return res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }

    async bulkCreate(req, res, next) {
        try {
            const { survey_id } = req.params;
            const { sections } = req.body;
            if (!sections || !Array.isArray(sections)) {
                throw new AppError("sections must be an array", 400);
            }
            const result = await SectionService.bulkCreateSections(survey_id, sections);
            return res.status(201).json(result);
        } catch (err) {
            next(err);
        }
    }
}

export default new SectionController();
