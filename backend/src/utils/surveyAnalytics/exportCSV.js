export function escapeCsvValue(v) {
  const s = v == null ? "" : String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function buildSurveyCSV({ survey_id, questions, optionsMap, responses }) {
  const headers = [
    "Response ID",
    "Status",
    "Submitted At",
    "Duration (s)",
    ...questions.map((q) => q.content),
  ];

  const rows = responses.map((res) => {
    const ansMap = {};
    (res.answers || []).forEach((a) => {
      ansMap[a.question_id] = a;
    });

    const row = [
      res.id,
      res.status,
      res.submitted_at ? new Date(res.submitted_at).toISOString() : "",
      res.submitted_at && res.created_at
        ? Math.round((new Date(res.submitted_at) - new Date(res.created_at)) / 1000)
        : "",
    ];

    questions.forEach((q) => {
      const a = ansMap[q.id];
      if (!a) {
        row.push("");
        return;
      }

      const isMulti = q.type === "MULTIPLE_CHOICE";
      const isChoice = ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "DROPDOWN"].includes(q.type);

      if (isChoice) {
        if (isMulti) {
          const selected =
            typeof a.selected_options === "string" ? JSON.parse(a.selected_options) : a.selected_options || [];

          const labels = (optionsMap[q.id] || [])
            .filter((o) => selected.includes(o.id))
            .map((o) => o.label);

          row.push(labels.join("; "));
        } else {
          const opt = (optionsMap[q.id] || []).find((o) => o.id === a.option_id);
          row.push(opt ? opt.label : "");
        }
      } else if (a.answer_text !== null && a.answer_text !== undefined) {
        row.push(a.answer_text);
      } else if (a.answer_number !== null && a.answer_number !== undefined) {
        row.push(String(a.answer_number));
      } else if (a.answer_date) {
        row.push(new Date(a.answer_date).toISOString().split("T")[0]);
      } else {
        row.push("");
      }
    });

    return row;
  });

  const csv = [
    headers.map(escapeCsvValue).join(","),
    ...rows.map((row) => row.map(escapeCsvValue).join(",")),
  ].join("\n");

  return {
    csv,
    filename: `survey-${survey_id}-export-${Date.now()}.csv`,
    row_count: rows.length,
  };
}

