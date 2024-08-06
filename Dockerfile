# השתמש בתמונה הרשמית של Node.js כתמונת בסיס, גרסה 16
FROM node:16

# צור ועבור לתיקיית האפליקציה
WORKDIR /app

# העתק את קובצי התלויות של האפליקציה לתוך תמונת הקונטיינר
COPY package*.json ./

# התקן את התלויות של הפרודקשן
RUN npm install

# העתק את הקוד המקומי לתוך תמונת הקונטיינר
COPY . .

# חשוף את פורט 3000 לעולם מחוץ לקונטיינר הזה
EXPOSE 3000

# הפעל את שירות האינטרנט בעת הפעלת הקונטיינר
CMD ["node", "Api.js"]
