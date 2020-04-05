// jshint esversion: 6
function main_chooseWords() {
  vue_chooseWords = new Vue({
    el: "#chooseWords",
    data: {
      choosables: [],
      chooseTime: 0
    }
  });

  socket.on("choosableWords", (choosables, chooseTime) => {
    vue_chooseWords.choosables = choosables;
    vue_chooseWords.chooseTime = chooseTime;
    $("#chooseWords").css("display", "block");
  });
  socket.on("tickChooseWord", chooseTime => {
    vue_chooseWords.chooseTime = chooseTime;
  });
}
