# Pulse Backend

API for Pulse Messenger

## How to run

- install the dependencies with node lts/hydrogen

```bash
npm i
```
  
- create a .env file

```env
DATABASE_ACCESS=Your mongo connection string
JWT_SECRET=Your JWT secret
APP_PORT=Your port

S3_BASE_URL=Your S3 base URL

EMAIL_USERNAME=Your gmail username
EMAIL_PASSWORD=Your gmail password

CLIENT_PATH=URL to your client
```

- run the API with

```bash
npm run build

npm start
```

- test the API with

```bash
npm run watch
```

## Docker

```bash
# build with
docker build -t backend .

# run with
docker run 
  -p 3000:3000
  --env-file .env
  backend
```
