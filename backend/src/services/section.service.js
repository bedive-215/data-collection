import models from "#models/index.js";
import { AppError } from "#middlewares/handleException.middlware.js";

import { mapSection } from "#mappers/section.mapper.js";

class SectionService {
    constructor() {
        this.Section = models.Section;
        this.Survey = models.Survey;
        this.Question = models.Question;
    }

    async createSection(survey_id, payload) {
        const { title, description, order_index, icon, cover_url, min_required, show_progress } = payload;

        const survey = await this.Survey.findByPk(survey_id);
        if (!survey) throw new AppError("Survey not found", 404);

        // Auto-assign order_index nếu không provided
        let nextOrder = order_index;
        if (nextOrder === undefined || nextOrder === null) {
            const last = await this.Section.findOne({
                where: { survey_id },
                order: [["order_index", "DESC"]],
                raw: true,
            });
            nextOrder = last ? last.order_index + 1 : 0;
        }

        const section = await this.Section.create({
            survey_id,
            title: title || null,
            description: description || null,
            order_index: nextOrder,
            icon: icon || null,
            cover_url: cover_url || null,
            min_required: min_required ?? null,
            show_progress: show_progress ?? true,
        });

        return {
            message: "Section created successfully",
            section: mapSection(section),
        };
    }

    async getSectionsBySurvey(survey_id) {
        const sections = await this.Section.findAll({
            where: { survey_id },
            include: [
                {
                    model: this.Question,
                    as: "questions",
                    attributes: ["id", "content", "type", "required", "order_index", "section_id"],
                    order: [["order_index", "ASC"]],
                },
            ],
            order: [["order_index", "ASC"]],
        });

        return {
            survey_id,
            sections: sections.map(s => mapSection(s)),
        };
    }

    async updateSection(section_id, payload) {
        const section = await this.Section.findByPk(section_id);
        if (!section) throw new AppError("Section not found", 404);

        const { title, description, order_index, icon, cover_url, min_required, show_progress } = payload;

        if (title !== undefined)       section.title = title;
        if (description !== undefined) section.description = description;
        if (order_index !== undefined) section.order_index = order_index;
        if (icon !== undefined)       section.icon = icon;
        if (cover_url !== undefined)  section.cover_url = cover_url;
        if (min_required !== undefined) section.min_required = min_required;
        if (show_progress !== undefined) section.show_progress = show_progress;

        await section.save();
        return { message: "Section updated", section: mapSection(section) };
    }

    async deleteSection(section_id) {
        const section = await this.Section.findByPk(section_id);
        if (!section) throw new AppError("Section not found", 404);

        // Unassign questions from this section (set section_id = null)
        await this.Question.update(
            { section_id: null },
            { where: { section_id } }
        );

        await section.destroy();
        return { message: "Section deleted" };
    }

    async reorderSections(survey_id, section_orders) {
        // section_orders: [{ id: uuid, order_index: 0 }, { id: uuid, order_index: 1 }]
        await Promise.all(
            section_orders.map(({ id, order_index }) =>
                this.Section.update({ order_index }, { where: { id, survey_id } })
            )
        );
        return { message: "Sections reordered" };
    }

    async bulkCreateSections(survey_id, sections) {
        const survey = await this.Survey.findByPk(survey_id);
        if (!survey) throw new AppError("Survey not found", 404);

        const created = await Promise.all(
            sections.map((s, i) =>
                this.Section.create({
                    survey_id,
                    title: s.title || null,
                    description: s.description || null,
                    order_index: s.order_index ?? i,
                    icon: s.icon || null,
                    cover_url: s.cover_url || null,
                    min_required: s.min_required ?? null,
                    show_progress: s.show_progress ?? true,
                })
            )
        );

        return {
            message: `${created.length} sections created`,
            sections: created.map(s => mapSection(s)),
        };
    }
}

export default new SectionService();
