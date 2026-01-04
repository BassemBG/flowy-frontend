how to run my part:

- generate a token from here and put it in .env file: https://developers.facebook.com/apps/1556561075390571/whatsapp-business/wa-dev-console/?business_id=1336351321364736

- make ngrok http 8000 and put the url (format: https://<ngrok_url>/whatsapp_agent/webhook) in the meta app webhook callback url config + use "flowy" as verify signature here: https://developers.facebook.com/apps/1556561075390571/whatsapp-business/wa-settings/?business_id=1336351321364736

- run the colab notebook and copy the generated url in the .env

- now run the docker-compose up --build