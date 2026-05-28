# API

## Table of Contents

- [How to use it?](#how-to-use-it)
- [How to get an API key?](#how-to-get-an-api-key)
- [Available Endpoints](#available-endpoints)
  - [API key](#api-key)
  - [Account](#account)
  - [Avatar](#avatar)
  - [Files](#files)
  - [Workspace](#workspace)

## How to use it?

Using DiffEd's API is easy:

1. Get your personal api key on your Account page.
2. From your desired application/program, send a request to endpoint with header `x-api-key: your_api_key`.

- On success you will be returned a json object `{ ok: true, data: if_any }`
- On failure you will be returned a json object `{ ok: false, error: error_message }`

For more information about API keys, see [How to get an API key?](#how-to-get-an-api-key). For full usage, see [Available Endpoints](#available-endpoints).

**Note:** Since the page is currently only available to run locally and not on the public internet, you need to use `<HOSTNAME>[:PORT]/endpoint`.

## How to get an API key?

- To get your personal API key, go to your Account page and create a new API key under section "API".
- Once you've created an API key, it's available to you until you decide to regenerate it, delete it, or your account is deleted.
  - Hint: You don't need to remember the key. You can copy it by using the **_Copy current API key_** button on your Account page.
- You can always regenerate a new api key with the **_Create new API key_** button, but note that the old one becomes invalid and cannot be used anymore.

**Please note that the key is personal and should not be shared with anyone!**

## Available Endpoints

### API key

#### Get API key

- Request type: `GET`
- Endpoint: `api/user/api-key`
- Return data on success:
  - API key as `string`
- Examples

```js
const response = fetch("/api/user/api-key", {method: "GET", headers: {"x-api-key": "your_api_key"}});
console.log(response.data); // logs your api key
```

```shell
curl -k -X GET -H "x-api-key: invalid_api_key" https://<HOSTNAME>[:PORT]/api/user/api-key
{"ok":false,"error":"Unauthorized"}
curl -k -X GET -H "x-api-key: valid_api_key" https://<HOSTNAME>[:PORT]/api/user/api-key
{"ok":true,"data":"valid_api_key"}
```

#### Regenerate API key

- Request type: `PATCH`
- Endpoint: `api/user/api-key`
- Return data on success:
  - the new api key as `string`
- Notice: regenerating invalidates your previous api key. The old key cannot be used anymore.
- Examples

```js
const response = fetch("/api/user/api-key", {method: "PATCH", headers: {"x-api-key": "your_api_key"}});
console.log(response.data); // logs your new api key
```

```shell
curl -k -X PATCH -H "x-api-key: your_api_key" https://<HOSTNAME>[:PORT]/api/user/api-key
{"ok":true,"data":"new-uuid-api-key"}
```

#### Delete API key

- Request type: `DELETE`
- Endpoint: `api/user/api-key`
- Return data on success:
  - `null`
- Notice: this invalidates your api key. You'll need to create a new one before you can use the API again.
- Examples

```js
fetch("/api/user/api-key", {method: "DELETE", headers: {"x-api-key": "your_api_key"}});
```

```shell
curl -k -X DELETE -H "x-api-key: your_api_key" https://<HOSTNAME>[:PORT]/api/user/api-key
{"ok":true,"data":null}
```

### Account

#### Get account info

- Request type: `GET`
- Endpoint: `api/user`
- Return data on success:
  - `id: number`
  - `username: string`
  - `email: string`
  - `github_linked: boolean`
  - `has_apikey: boolean`
  - `vim_bindings: boolean`
- Examples

```js
const response = fetch("/api/user", {method: "GET", headers: {"x-api-key": "your_api_key"}});
console.log(response.data); // logs your account info
```

```shell
curl -k -X GET -H "x-api-key: your_api_key" https://<HOSTNAME>[:PORT]/api/user
{"ok":true,"data":{"id":1,"username":"jane","email":"jane@example.com","github_linked":false,"has_apikey":true,"vim_bindings":false}}
```

#### Update account

- Request type: `PATCH`
- Endpoint: `api/user`
- Request body (JSON, all fields optional):
  - `username: string`, a new username
  - `email: string`, a new email
  - `newPassword: string`, a new password
  - `newPassword2: string`, must match `newPassword`
  - `vim_bindings: boolean`, the editor key bindings preference
  - `password: string`, your current password, required for any change except `vim_bindings` (GitHub-only accounts have no password and can omit it)
- Return data on success:
  - `null`
- Errors:
  - 400 if the current password is missing or wrong, nothing was sent to update, or the new passwords do not match
  - 409 if the new username or email is already taken
- Examples

```js
fetch("/api/user", {
	method: "PATCH",
	headers: {"x-api-key": "your_api_key", "Content-Type": "application/json"},
	body: JSON.stringify({vim_bindings: true}),
});
```

```shell
curl -k -X PATCH -H "x-api-key: your_api_key" -H "Content-Type: application/json" \
  -d '{"email":"new@example.com","password":"current_password"}' \
  https://<HOSTNAME>[:PORT]/api/user
{"ok":true,"data":null}
```

#### Delete account

- Request type: `DELETE`
- Endpoint: `api/user`
- Request body (JSON):
  - `password: string`, your current password (GitHub-only accounts have no password and can omit it)
- Return data on success:
  - `null`
- Errors:
  - 400 if the current password is missing or wrong
- Notice: this permanently deletes your account and everything in it. It cannot be undone.
- Examples

```js
fetch("/api/user", {
	method: "DELETE",
	headers: {"x-api-key": "your_api_key", "Content-Type": "application/json"},
	body: JSON.stringify({password: "your_password"}),
});
```

```shell
curl -k -X DELETE -H "x-api-key: your_api_key" -H "Content-Type: application/json" \
  -d '{"password":"your_password"}' <HOSTNAME>[:PORT]/api/user
{"ok":true,"data":null}
```

#### Unlink GitHub

- Request type: `DELETE`
- Endpoint: `api/auth/github/link`
- Return data on success:
  - `null`
- Errors:
  - 400 if your account has no password set, since unlinking would leave you with no way to log in
- Examples

```js
fetch("/api/auth/github/link", {method: "DELETE", headers: {"x-api-key": "your_api_key"}});
```

```shell
curl -k -X DELETE -H "x-api-key: your_api_key" https://<HOSTNAME>[:PORT]/api/auth/github/link
{"ok":true,"data":null}
```

### Avatar

#### Get avatar

- Request type: `GET`
- Endpoint: `api/user/avatar`
- Return data on success:
  - the avatar image file itself — this endpoint responds with the raw image, not the usual `{ ok, data }` object. Returns the default avatar if you haven't set one.
- Examples

```js
const response = fetch("/api/user/avatar", {method: "GET", headers: {"x-api-key": "your_api_key"}});
// response body is the raw image file
```

```shell
curl -k -H "x-api-key: your_api_key" https://<HOSTNAME>[:PORT]/api/user/avatar --output avatar.jpg
```

#### Update avatar

- Request type: `PUT`
- Endpoint: `api/user/avatar`
- Request body (multipart/form-data):
  - `avatar: File`, the image to upload — must be JPEG, PNG or WebP, max 1 MiB
- Return data on success:
  - `null`
- Errors:
  - 400 if the file is not a JPEG, PNG or WebP, or was sent under the wrong field name
  - 413 if the file is larger than 1 MiB
- Examples

```js
const data = new FormData();
data.append("avatar", myImageFile);
fetch("/api/user/avatar", {method: "PUT", headers: {"x-api-key": "your_api_key"}, body: data});
```

```shell
curl -k -X PUT -H "x-api-key: your_api_key" -F "avatar=@picture.png" https://<HOSTNAME>[:PORT]/api/user/avatar
{"ok":true,"data":null}
```

#### Delete avatar

- Request type: `DELETE`
- Endpoint: `api/user/avatar`
- Return data on success:
  - `null`
- Errors:
  - 404 if you have no custom avatar to remove
- Examples

```js
fetch("/api/user/avatar", {method: "DELETE", headers: {"x-api-key": "your_api_key"}});
```

```shell
curl -k -X DELETE -H "x-api-key: your_api_key" https://<HOSTNAME>[:PORT]/api/user/avatar
{"ok":true,"data":null}
```

### Files

#### List files

- Request type: `GET`
- Endpoint: `api/files`
- Return data on success:
  - an `array` of your files, each with:
    - `id: string`, a UUID
    - `name: string`
- Examples

```js
const response = fetch("/api/files", {method: "GET", headers: {"x-api-key": "your_api_key"}});
console.log(response.data); // logs your files
```

```shell
curl -k -X GET -H "x-api-key: your_api_key" https://<HOSTNAME>[:PORT]/api/files
{"ok":true,"data":[{"id":"a1b2c3d4-...","name":"hello.txt"}]}
```

#### Get file

- Request type: `GET`
- Endpoint: `api/files/:fileId`
- Request parameters:
  - `:fileId` - the UUID of the file, in the URL path
- Return data on success:
  - `id: string`, a UUID
  - `name: string`
  - `content: string`
- Errors:
  - 400 if the file id is not a valid UUID
  - 403 if the file does not exist or is not yours
- Examples

```js
const response = fetch("/api/files/a1b2c3d4-...", {method: "GET", headers: {"x-api-key": "your_api_key"}});
console.log(response.data); // logs the file
```

```shell
curl -k -X GET -H "x-api-key: your_api_key" https://<HOSTNAME>[:PORT]/api/files/a1b2c3d4-...
{"ok":true,"data":{"id":"a1b2c3d4-...","name":"hello.txt","content":"hi there"}}
```

#### Upload file

- Request type: `POST`
- Endpoint: `api/files`
- Request body (multipart/form-data):
  - `file: File`, the file to upload (a single file)
- Return data on success:
  - the new file's id as `string`
- Errors:
  - 400 if no file was provided
  - 409 if a file with the same name already exists
  - 415 if the file type, size or encoding is not accepted, only text files are allowed
- Examples

```js
const data = new FormData();
data.append("file", myFile);
fetch("/api/files", {method: "POST", headers: {"x-api-key": "your_api_key"}, body: data});
```

```shell
curl -k -X POST -H "x-api-key: your_api_key" -F "file=@hello.txt" https://<HOSTNAME>[:PORT]/api/files
{"ok":true,"data":"a1b2c3d4-..."}
```

#### Delete file

- Request type: `DELETE`
- Endpoint: `api/files/:fileId`
- Request parameters:
  - `:fileId` - the UUID of the file, in the URL path
- Return data on success:
  - `null`
- Errors:
  - 400 if the file id is not a valid UUID
  - 403 if the file does not exist or is not yours
- Examples

```js
fetch("/api/files/a1b2c3d4-...", {method: "DELETE", headers: {"x-api-key": "your_api_key"}});
```

```shell
curl -k -X DELETE -H "x-api-key: your_api_key" https://<HOSTNAME>[:PORT]/api/files/a1b2c3d4-...
{"ok":true,"data":null}
```

### Workspace

#### Create workspace

- Request type: `POST`
- Endpoint: `api/workspace`
- Request body (JSON):
  - `fileId: string`, the UUID of the file to open a collaboration workspace for
- Return data on success:
  - `workspaceId: string`, a UUID
- Errors:
  - 400 if the file id is not a valid UUID
  - 403 if the file does not exist or is not yours
- Examples

```js
const response = fetch("/api/workspace", {
	method: "POST",
	headers: {"x-api-key": "your_api_key", "Content-Type": "application/json"},
	body: JSON.stringify({fileId: "a1b2c3d4-..."}),
});
console.log(response.data); // logs { workspaceId: "..." }
```

```shell
curl -k -X POST -H "x-api-key: your_api_key" -H "Content-Type: application/json" \
  -d '{"fileId":"a1b2c3d4-..."}' <HOSTNAME>[:PORT]/api/workspace
{"ok":true,"data":{"workspaceId":"f5e6d7c8-..."}}
```

#### Get workspace

- Request type: `GET`
- Endpoint: `api/workspace/:workspaceId`
- Request parameters:
  - `:workspaceId` - the UUID of the workspace, in the URL path
- Return data on success:
  - `id: string`, the workspace UUID
  - `members: array` of objects, each with:
    - `id: number`
    - `username: string`
- Errors:
  - 400 if the workspace id is not a valid UUID
  - 404 if the workspace does not exist
- Examples

```js
const response = fetch("/api/workspace/f5e6d7c8-...", {method: "GET", headers: {"x-api-key": "your_api_key"}});
console.log(response.data); // logs the workspace info
```

```shell
curl -k -X GET -H "x-api-key: your_api_key" https://<HOSTNAME>[:PORT]/api/workspace/f5e6d7c8-...
{"ok":true,"data":{"id":"f5e6d7c8-...","members":[{"id":1,"username":"jane"}]}}
```
