# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Create a directory for the app inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Expose the port that your app runs on (assuming 5000)
EXPOSE 5000

# Define the command to run your app
CMD [ "npm", "start" ]
