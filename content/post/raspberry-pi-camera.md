+++
date = "2017-01-30T22:20:41+03:00"
draft = false
title = "Raspberry Pi surveillance camera with ML"
description = "Combine simple hardware with some cleaver machine learning APIs"
tags = [ "Machine learning", "Raspberry PI" ]
thumbnail = "images/raspberry-pi-camera/pi-logo.png"
+++

{{% img src="/images/raspberry-pi-camera/camera.jpg" w="600" h="800" %}}

Raspberry PI has the most amazing hardware to create your own simple *surveillance camera* by combining free/open source software. My end goal is to make automated person/human detection and based on the detection send me an email or push notification with an image. Another important goal is to keep the whole solution based on *open-source* or *free software components/services*.

Component list:

  - Raspberry PI - model A
  - RaspberrryPI official noIR camera(tested also with USB cameras)
  - Passive infrared sensor(PIR)

The flow begins with movement detection, there are roughly two ways for detection: hardware and software. I started with software based movement detection using open source [motion](https://github.com/Motion-Project/motion) project which has lots of different settings to tweak and is a great way to start if you don't want to do any programming. You could stream/capture the short movies or images of the detected event which are all handled by motion. I did have problems with the detection accuracy when the image contrast changed drastically by sun or wind caused tree shaking. I tweaked the pixel movement threshold and got better results, although there were still many false positives.
Next, I purchased PIR from Aliexpress and connect it to my Raspberry PI. I didn't know how to combine the PIR to motion, so instead of that, I used Python script and removed completely motion library. The detection rate was quite accurate and worked really well. The only problem was that it didn't work through the glass so I had to move back to the motion-based solution. It is possible to make the alternative motion solution only using Python and OpenCV capture frames and detect the difference blobs.

Before storing the detected image in the cloud, I used the Microsoft Vision API(5k API calls are free) to detect the image content, get the tags and image description. If the image contains person(probability at least over 85%) then the image will be stored in the cloud. If the MS Vision API isn't the best match for you then there are many other providers as well: Google, AWS, Cloudinary etc. AWS ML allows access directly the S3 files so you can avoid the double upload.

For image storage, I did choose Dropbox REST API free tier which is in most uses cases enough. All captured images are also stored locally. After every week the local and Dropbox directory get's cleanup(Dropbox directory should be restorable for one month). Instead of Dropbox, you could also use the AWS S3 service to store all the images, MS OneDrive, Cloudinary etc.

The hardest part was to get working the notifications sending, there are so many services to do that Twilio, AWS SNS, IFTTT, Zapier etc. I didn't want to code this part so I decided to use automation services like IFTTT and Zapier. The idea is to send email on based Dropbox file upload. I started with setting up the IFTTT Dropbox applet however, the applet didn't work with the Dropbox Application folder which is a bit different folders. Next, I moved to Zapier all the integrations worked really well and I managed to get it up really quickly. The only problem with Zapier is that the free tier could execute only 100 tasks in a month.

{{% img src="/images/raspberry-pi-camera/winter.jpg" w="600" h="400" %}}

The overall setup works really well only that after some testing I already hit the Zapier limits. I haven't found some other good service to replace Zapier. One possible solution is to use Dropbox webhook events and setup some micro server to Heroku and send the email from there.
