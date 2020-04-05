// jshint esversion: 6
function main_artgallery() {
  vue_artgallery = new Vue({
    el: "#artgallery",
    data: {
      username: "",
      images: [],
    },
    methods: {
      genitive(username) {
        if (username.endsWith("s")) return "";
        else return "s";
      },
    },
  });

  socket.on("art", (word, data) => {
    vue_artgallery.images.push({ word, data: `data:image/png;base64,${data}` });
  });
}
