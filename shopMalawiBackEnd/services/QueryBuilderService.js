class QueryBuilderService {
  /**
   * Build a SELECT query with multiple options
   * @param {object} options Query building options
   * @returns {object} Object containing query string and parameters
   */
  static buildSelect({
    table,
    fields = ["*"],
    joins = [],
    where = {},
    whereOr = [],
    groupBy = [],
    having = {},
    orderBy = [],
    limit = null,
    offset = null,
    distinct = false,
    forUpdate = false,
    useIndex = null,
    subqueries = {},
  }) {
    const params = [];
    let query = `SELECT ${distinct ? "DISTINCT " : ""}`;

    // Handle field selection
    const fieldList = this.buildFieldList(fields, subqueries);
    query += fieldList;

    // FROM clause
    query += ` FROM ${table}`;

    // Add index hint if specified
    if (useIndex) {
      query += ` USE INDEX (${useIndex})`;
    }

    // Handle JOINs
    if (joins.length > 0) {
      query += " " + this.buildJoins(joins, params);
    }

    // WHERE conditions
    const whereClause = this.buildWhereClause(where, whereOr);
    if (whereClause.sql) {
      query += ` WHERE ${whereClause.sql}`;
      params.push(...whereClause.params);
    }

    // GROUP BY
    if (groupBy.length > 0) {
      query += ` GROUP BY ${groupBy.join(", ")}`;
    }

    // HAVING
    if (Object.keys(having).length > 0) {
      const havingClause = this.buildWhereClause(having);
      if (havingClause.sql) {
        query += ` HAVING ${havingClause.sql}`;
        params.push(...havingClause.params);
      }
    }

    // ORDER BY
    if (orderBy.length > 0) {
      query += ` ORDER BY ${orderBy
        .map((o) =>
          typeof o === "string" ? o : `${o.field} ${o.direction || "ASC"}`
        )
        .join(", ")}`;
    }

    // LIMIT and OFFSET
    if (limit) {
      query += ` LIMIT ?`;
      params.push(Number(limit));
      if (offset) {
        query += ` OFFSET ?`;
        params.push(Number(offset));
      }
    }

    if (forUpdate) {
      query += " FOR UPDATE";
    }

    return { query, params };
  }

  /**
   * Build field list including subqueries
   */
  static buildFieldList(fields, subqueries = {}) {
    const fieldList = fields.map((field) => {
      if (typeof field === "string") {
        return field;
      }
      if (field.subquery && subqueries[field.subquery]) {
        return `(${subqueries[field.subquery]}) AS ${field.alias}`;
      }
      if (field.raw) {
        return field.raw;
      }
      return `${field.table || ""}.${field.name}${
        field.alias ? ` AS ${field.alias}` : ""
      }`;
    });

    return fieldList.join(", ");
  }

  /**
   * Build JOIN clauses
   */
  static buildJoins(joins, params) {
    return joins
      .map((join) => {
        const type = join.type?.toUpperCase() || "LEFT";
        let sql = `${type} JOIN ${join.table}`;

        if (join.on) {
          sql += ` ON ${join.on}`;
        } else if (join.using) {
          sql += ` USING (${join.using})`;
        }

        if (join.params) {
          params.push(...join.params);
        }

        return sql;
      })
      .join(" ");
  }

  /**
   * Build WHERE clause
   */
  static buildWhereClause(where, whereOr = []) {
    const conditions = [];
    const params = [];

    // Handle regular WHERE conditions
    Object.entries(where).forEach(([key, value]) => {
      if (value === null) {
        conditions.push(`${key} IS NULL`);
      } else if (Array.isArray(value)) {
        conditions.push(`${key} IN (?)`);
        params.push(value);
      } else if (typeof value === "object") {
        if (value.operator) {
          conditions.push(`${key} ${value.operator} ?`);
          params.push(value.value);
        }
      } else {
        conditions.push(`${key} = ?`);
        params.push(value);
      }
    });

    // Handle OR conditions
    if (whereOr.length > 0) {
      const orConditions = whereOr.map((condition) => {
        const { sql, params: orParams } = this.buildWhereClause(condition);
        params.push(...orParams);
        return `(${sql})`;
      });
      if (orConditions.length > 0) {
        conditions.push(`(${orConditions.join(" OR ")})`);
      }
    }

    return {
      sql: conditions.join(" AND "),
      params,
    };
  }

  /**
   * Build messages query with optimizations
   */
  static buildMessagesQuery(options) {
    const {
      conversationId,
      cursor,
      cursorParams,
      searchTerm,
      limit = 20,
    } = options;

    return this.buildSelect({
      table: "messages m",
      fields: [
        "m.*",
        {
          raw: 'JSON_OBJECT("id", u.id, "username", u.username, "avatar", u.avatar_url) as sender',
        },
        options.includeAttachments && {
          raw: 'JSON_ARRAYAGG(JSON_OBJECT("id", ma.id, "type", ma.file_type, "url", ma.file_path)) as attachments',
        },
        options.includeReactions && {
          raw: 'JSON_ARRAYAGG(JSON_OBJECT("id", mr.id, "type", mr.reaction_type, "user_id", mr.user_id)) as reactions',
        },
      ].filter(Boolean),
      joins: [
        { table: "users u", on: "m.sender_id = u.id" },
        options.includeAttachments && {
          type: "LEFT",
          table: "message_attachments ma",
          on: "m.id = ma.message_id",
        },
        options.includeReactions && {
          type: "LEFT",
          table: "message_reactions mr",
          on: "m.id = mr.message_id",
        },
      ].filter(Boolean),
      where: {
        "m.conversation_id": conversationId,
        "m.deleted_at IS NULL": null,
        ...(cursor && cursorParams
          ? {
              [`m.created_at ${cursorParams.operator}`]: {
                operator: "=",
                value: cursor,
              },
            }
          : {}),
      },
      ...(searchTerm && {
        whereOr: [
          {
            "MATCH(m.text) AGAINST(? IN NATURAL LANGUAGE MODE)": searchTerm,
          },
        ],
      }),
      groupBy: ["m.id"],
      orderBy: [
        { field: "m.created_at", direction: cursorParams?.orderDir || "ASC" },
      ],
      limit,
      useIndex: "idx_conversation_created",
    });
  }

  /**
   * Build conversations list query with optimizations
   */
  static buildConversationsQuery(options) {
    const { userId, limit = 20, offset = 0 } = options;

    return this.buildSelect({
      table: "conversations c",
      fields: [
        "c.*",
        "cm.title",
        "cm.description",
        "cm.is_group",
        "cm.avatar_url",
        options.includeUnreadCount && {
          raw: "COUNT(DISTINCT CASE WHEN m.is_read = FALSE AND m.sender_id != ? THEN m.id END) as unread_count",
        },
        options.includeLastMessage && {
          raw: `JSON_OBJECT(
            'id', m.id,
            'text', m.text,
            'sender_id', m.sender_id,
            'created_at', m.created_at,
            'delivery_status', m.delivery_status
          ) as last_message`,
        },
      ].filter(Boolean),
      joins: [
        {
          table: "conversation_participants cp",
          on: "c.id = cp.conversation_id",
        },
        {
          type: "LEFT",
          table: "conversation_metadata cm",
          on: "c.id = cm.conversation_id",
        },
        { type: "LEFT", table: "messages m", on: "m.id = c.last_message_id" },
      ],
      where: {
        "cp.user_id": userId,
        "c.deleted_at IS NULL": null,
        "cp.is_archived": false,
      },
      groupBy: ["c.id"],
      orderBy: [
        options.includePinned && { field: "cp.is_pinned", direction: "DESC" },
        { field: "COALESCE(c.updated_at, c.created_at)", direction: "DESC" },
      ].filter(Boolean),
      limit,
      offset,
      useIndex: "idx_participant_updated",
    });
  }
}

export default QueryBuilderService;
