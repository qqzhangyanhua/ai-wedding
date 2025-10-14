const a = {
  model: "gemini-2.5-flash-image",
  temperature: 0.2,
  top_p: 0.7,
  messages: [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: "Please edit the provided original image based on the following guidelines:\n\nSTRICT REQUIREMENTS:\n1. ABSOLUTELY preserve all facial features, facial contours, eye shape, nose shape, mouth shape, and all key characteristics from the original image\n2. Maintain the person's basic facial structure and proportions COMPLETELY unchanged\n3. Ensure the person in the edited image is 100% recognizable as the same individual\n4. NO changes to any facial details including skin texture, moles, scars, or other distinctive features\n5. If style conversion is involved, MUST maintain facial realism and accuracy\n6. Focus ONLY on non-facial modifications as requested\n\nSPECIFIC EDITING REQUEST: A wedding photo full of Song Dynasty aesthetics, studying in the study. A couple is in an elegant study. The man wears a simple and elegant Zhiduo Lanshan, the woman a narrow-sleeved Beizi and Baidie skirt. The wife stands by the desk, grinding ink for her husband with her delicate hands, while the husband holds a brush writing; they both look up simultaneously, sharing a smile, their gazes tender and understanding. The background is a wall of bookshelves and scrolls, with sparse bamboo shadows outside the window. Light comes from soft natural light outside the window and a warm oil lamp on the desk, creating a tranquil atmosphere. Colors are in low-saturation hues like stone blue, moon white, and light ochre, the composition has blank space, full of subtle and restrained literati charm.\n\nPlease focus your modifications ONLY on the user's specific requirements while strictly following the face preservation guidelines above. Generate a high-quality edited image that maintains facial identity.",
        },
        {
          type: "image_url",
          image_url: {
            url: "data:image/jpeg;base64,...",
          },
        },
      ],
    },
  ],
  stream: true,
  stream_options: { include_usage: true },
};
