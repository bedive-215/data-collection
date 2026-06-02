import { Op } from "sequelize";
import models from "#models/index.js";
const { Survey, Question, Response, SurveyParticipant } = models;

import { AppError } from "#middlewares/handleException.middlware.js";

import { formatDate } from "#helpers/aiChat.helper.js";
import { mapSurveyList } from "#mappers/aiChat.mapper.js";

import SurveyService from "#services/survey.service.js";

import {
  buildSurveyListMessage,
  buildSearchSurveyMessage,
  buildSurveyDetailMessage,
  buildAddQuestionsMessage,
  buildCreateSurveyMessage
} from "../builders/survey.builder.js";
import { getSurveyStatus } from "#domain/survey.domain.js";

export async function listMySurveys({ args, user }) {
  const where = { created_by: user.id };
  const now = new Date();

  if (args.status === "ACTIVE") {
    where[Op.and] = [
      { [Op.or]: [{ start_at: null }, { start_at: { [Op.lte]: now } }] },
      { [Op.or]: [{ end_at: null }, { end_at: { [Op.gte]: now } }] },
    ];
  } else if (args.status === "SCHEDULED") {
    where.start_at = { [Op.gt]: now };
  } else if (args.status === "EXPIRED") {
    where.end_at = { [Op.lt]: now };
  }

  const surveys = await Survey.findAll({
    where,
    order: [["created_at", "DESC"]],
    limit: 50,
    attributes: ["id", "title", "description", "created_at", "start_at", "end_at"],
    include: [
      { model: Question, as: "questions", attributes: ["id"], required: false },
      { model: Response, as: "responses", attributes: ["id"], required: false },
      { model: SurveyParticipant, as: "participants", attributes: ["id"], required: false },
    ],
  });

  const mapped = mapSurveyList(surveys);
  return {
    data: { surveys: mapped, total: mapped.length },
    _reply: buildSurveyListMessage(mapped),
    meta: { tool: "list_my_surveys" },
  };
}
export async function searchSurveys({ args, user }) {
  const { keyword } = args;

  if (!keyword) {
    return {
      _reply: "Bạn muốn tìm khảo sát nào?",
      need_input: true
    };
  }

  const surveys = await Survey.findAll({
    where: {
      created_by: user.id,
      [Op.or]: [
        { title: { [Op.like]: `%${keyword}%` } },
        { description: { [Op.like]: `%${keyword}%` } },
      ],
    },
    limit: 10,
    order: [["created_at", "DESC"]],
  });

  if (!surveys.length) {
    return {
      _reply: `Không tìm thấy khảo sát nào với từ khóa "${keyword}"`,
    };
  }

  return {
    data: surveys,
    _reply: buildSurveyListMessage(mapSurveyList(surveys)),
  };
}


export async function getSurveyDetail({ args, user }) {
  const { survey_id, keyword } = args;

  let survey;

  if (survey_id) {
    survey = await Survey.findByPk(survey_id);
  }

  if (!survey && keyword) {
    const candidates = await Survey.findAll({
      where: {
        created_by: user.id,
        title: { [Op.like]: `%${keyword}%` },
      },
      limit: 5,
      order: [["created_at", "DESC"]],
    });

    if (candidates.length > 1) {
      return {
        _reply: buildSurveyListMessage(mapSurveyList(candidates)),
        need_selection: true,
        candidates: candidates.map(c => ({
          id: c.id,
          title: c.title,
        })),
      };
    }

    survey = candidates[0];
  }

  if (!survey) {
    return {
      _reply: "Không tìm thấy khảo sát nào.",
      need_search: true,
    };
  }

  const [responseCount, participantCount] = await Promise.all([
    Response.count({ where: { survey_id: survey.id } }),
    SurveyParticipant.count({ where: { survey_id: survey.id } }),
  ]);

  return {
    id: survey.id,
    _reply: buildSurveyDetailMessage(survey, {
      responseCount,
      participantCount,
    }),
  };
}

export async function createSurvey({ args, user }) {
  const title = (args?.title && String(args.title).trim()) ? String(args.title).trim() : "Khảo sát mới";
  const description = args?.description ? String(args.description).trim() : null;

  const survey = await Survey.create({
    title, description, created_by: user.id, start_at: null, end_at: null,
  });

  return {
    id: survey.id,
    title: survey.title,
    _reply: buildCreateSurveyMessage(survey),
  };
}

export async function addQuestions({ args, user }) {
  const { survey_id, questions } = args;
  if (!survey_id) return { _reply: "Mình cần biết bạn muốn thêm vào khảo sát nào. Bạn cho mình biết tên khảo sát được không?", need_search: true };

  const survey = await Survey.findOne({ where: { id: survey_id, created_by: user.id } });
  if (!survey) return { _reply: "Không tìm thấy khảo sát. Bạn cho mình biết tên khảo sát được không?", need_search: true };

  const existingCount = await Question.count({ where: { survey_id } });
  const created = [];

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const isChoice = ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "DROPDOWN"].includes(q.type);
    const question = await Question.create({
      survey_id, content: q.content, type: q.type,
      required: q.required !== false, order_index: existingCount + i, settings: {},
    });
    if (isChoice && q.options?.length > 0) {
      await QuestionOption.bulkCreate(
        q.options.map((opt, idx) => ({ question_id: question.id, label: opt.label, value: opt.value || `opt_${idx + 1}`, order_index: idx }))
      );
    }
    created.push({ id: question.id, content: question.content, type: question.type });
  }

  return {
    survey_id,
    survey_title: survey.title,
    action: "QUESTIONS_ADDED",
    created_count: created.length,
    questions: created,
    _reply: buildAddQuestionsMessage(survey, created, existingCount + created.length),
  };
}