// jshint esversion: 6
function main_chatlog() {
  vue_chatlog = new Vue({
    el: "#chatlog",
    data: {
      chatlog: [],
    },
    methods: {},
    updated() {
      // TODO: Make initial scroll when joining the room.
      $("#chatlog")[0].scrollTo({
        top: $("#chatlog")[0].scrollHeight,
        left: 0,
        behavior: "smooth",
      });
    },
  });

  socket.on("message", (message) => {
    vue_chatlog.chatlog.push(message);
  });
}
