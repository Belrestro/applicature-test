const fs = require('fs');
const sendmail = require('sendmail')({
  silent: true,
  dkim: {
    privateKey: fs.readFileSync('./dkim-private.pem'),
    keySelector: '1510586783.ghostdomain'
  }
});

module.exports = {
  sendMail({email, subject, html}) {
    return new Promise((res, rej) => {
      const options = {
        from: 'info@ghostdomain.com',
        to: email,
        replyTo: 'info@ghostdomain.com',
        subject,
        html
      };
      sendmail(options, (err, reply) => {
        if (err) {
          return rej(err);
        }
        return res(reply);
      });
    })
  }
};
