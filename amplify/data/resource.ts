import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

/*== STEP 1 ===============================================================
The section below creates a Todo database table with a "content" field. Try
adding a new "isDone" field as a boolean. The authorization rule below
specifies that any user authenticated via an API key can "create", "read",
"update", and "delete" any "Todo" records.
=========================================================================*/
const schema = a.schema({
  // kakaoLoginCookie 모델 정의: API 키 저장용
  kakaoLoginCookie: a
    .model({
      APIkey: a.string(),
      _T_ANO: a.string(),       // 사용자가 입력한 API 키
      _kawlt: a.string(),   
      _kawltea: a.string(),   
      _karmt: a.string(),   
      _karmtea: a.string(),   
      _kahai: a.string(),   
      _kau: a.string(),   

      createdAt: a.string(),    // 세션 생성 시각
      expireAt: a.string()
    })
    .authorization((allow) => [allow.publicApiKey()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
    // API Key is used for a.allow.public() rules
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});

/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server 
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>
