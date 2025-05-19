const nodemailer = require('nodemailer');
const config = require('../config.json');

module.exports = sendEmail;

async function sendEmail({ to, subject, html, from = config.emailFrom }) { 
    console.log('Sending email to:', to);
    console.log('Email subject:', subject);
    console.log('SMTP config:', {
        host: config.smtpOptions.host,
        port: config.smtpOptions.port,
        user: config.smtpOptions.auth.user
    });
    
    const transporter = nodemailer.createTransport(config.smtpOptions);
    
    try {
        const info = await transporter.sendMail({ from, to, subject, html });
        console.log('Email sent successfully:', info.messageId);
        console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
}