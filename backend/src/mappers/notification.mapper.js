export function mapNotification(n) {
  const d = n.dataValues || n;
  const rawData = d.data || {};

  return {
    id: d.id,
    type: d.type ?? null,
    title: d.title,
    message: d.message,
    data: {
      // Flatten key fields for consistency with socket payload
      surveyId:         rawData.surveyId         ?? rawData.survey_id         ?? null,
      surveyTitle:      rawData.surveyTitle      ?? rawData.title             ?? null,
      surveyEndAt:      rawData.surveyEndAt      ?? rawData.end_at            ?? null,
      surveyDescription:rawData.surveyDescription?? rawData.survey_description ?? null,
      responseCount:    rawData.responseCount    ?? rawData.response_count    ?? null,
      role:             rawData.role             ?? null,
      roleLabel:        rawData.roleLabel        ?? rawData.role_label        ?? null,
      inviterId:        rawData.inviterId        ?? rawData.inviter_id        ?? null,
      inviterName:      rawData.inviterName      ?? rawData.inviter_name      ?? null,
      inviterAvatar:    rawData.inviterAvatar    ?? rawData.inviter_avatar    ?? null,
      responderId:      rawData.responderId      ?? rawData.responder_id      ?? null,
      responderName:    rawData.responderName    ?? rawData.responder_name    ?? null,
      participantId:    rawData.participantId    ?? rawData.participant_id    ?? null,
      participantName:  rawData.participantName  ?? rawData.participant_name  ?? null,
      inviteeEmail:     rawData.inviteeEmail     ?? rawData.invitee_email     ?? null,
      createdBy:        rawData.createdBy        ?? rawData.created_by        ?? null,
      accessType:       rawData.accessType       ?? rawData.access_type       ?? null,
      expireInfo:       rawData.expireInfo       ?? rawData.expire_info       ?? null,
      // Keep raw data for any other fields not explicitly listed above
      ...Object.fromEntries(
        Object.entries(rawData).filter(([k]) => ![
          'surveyId','survey_id','surveyTitle','title','surveyEndAt','end_at',
          'surveyDescription','survey_description','responseCount','response_count',
          'role','roleLabel','role_label','inviterId','inviter_id','inviterName','inviter_name',
          'inviterAvatar','inviter_avatar','responderId','responder_id','responderName','responder_name',
          'participantId','participant_id','participantName','participant_name',
          'inviteeEmail','invitee_email','createdBy','created_by','accessType','access_type','expireInfo','expire_info',
        ].includes(k))
      ),
    },
    read: d.read,
    readAt: d.read_at ?? d.readAt ?? null,
    created_at: d.created_at ?? d.createdAt ?? null,
  };
}