import express from 'express';

const app = express();

app.get('/', (req, res) => {
    res.send('Hello World');
    });

app.listen(3000, () => {
    console.log('Server is running on port 3000');
    });

app.get('/object', (req, res) => {

    const responseObj = {
        status: "success",
        data: {
          msg: "This is a message from the response object",
        },
      };
      // Sending a response
      res.send(responseObj.data.msg);
    });
