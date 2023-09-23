let combatFriend2eConfig;

Hooks.on("ready", function () {
  combatFriend2eConfig = new CombatFriend2eConfig();
  combatFriend2eConfig.render(true, { userId: game.userId });
});

Hooks.once("socketlib.ready", () => {
  socket = socketlib.registerModule("combatfriend2e");
  socket.register("next", nextRound);
});

function nextRound(gm, party, round) {
  combatFriend2eConfig.gmInit = gm;
  combatFriend2eConfig.partyInit = party;
  combatFriend2eConfig.round = round;
  combatFriend2eConfig.render(true);
}

class CombatFriend2eConfig extends FormApplication {
  gmInit = 0;
  partyInit = 0;
  round = 0;

  static get defaultOptions() {
    const defaults = super.defaultOptions;

    const overrides = {
      height: "auto",
      id: "combatfriend2e",
      template: "modules/combatfriend2e/templates/combatfriend2e.hbs",
      title: "Combat Friend 2E",
      userId: game.userId,
    };

    const mergedOptions = foundry.utils.mergeObject(defaults, overrides);

    return mergedOptions;
  }

  activateListeners(html) {
    html.on("click", "[data-action]", this._handleButtonClick);
  }

  async _handleButtonClick(event) {
    const clickedElement = $(event.currentTarget);
    const action = clickedElement.data().action;

    switch (action) {
      case "next": {
        combatFriend2eConfig.round += 1;
        combatFriend2eConfig.gmInit = Math.floor(Math.random() * 10 + 1);
        combatFriend2eConfig.partyInit = Math.floor(Math.random() * 10 + 1);
        break;
      }

      case "end": {
        combatFriend2eConfig.round = 0;
        break;
      }
    }

    socket.executeForEveryone(
      "next",
      combatFriend2eConfig.gmInit,
      combatFriend2eConfig.partyInit,
      combatFriend2eConfig.round
    );

    combatFriend2eConfig.render(true);
  }

  getData(options) {
    console.log("combatfriend2e | " + game.users.activeGM.id);
    return {
      gm: combatFriend2eConfig.gmInit,
      party: combatFriend2eConfig.partyInit,
      round: combatFriend2eConfig.round,
      isGM: game.users.current.id === game.users.activeGM?.id,
    };
  }
}

/*
let socket;

Hooks.once("socketlib.ready", () => {
  socket = socketlib.registerModule("combatfriend2e");
  socket.register("hello", showHelloMessage);
  socket.register("add", add);
});

Hooks.once("ready", async () => {
  // Let's send a greeting to all other connected users.
  // Functions can either be called by their given name...
  socket.executeForEveryone("hello", game.user.name);
  // ...or by passing in the function that you'd like to call.
  socket.executeForEveryone(showHelloMessage, game.user.name);
  // The following function will be executed on a GM client.
  // The return value will be sent back to us.
  const result = await socket.executeAsGM("add", 5, 3);
  console.log(`The GM client calculated: ${result}`);
});

function showHelloMessage(userName) {
  console.log(`User ${userName} says hello!`);
}

function add(a, b) {
  console.log("The addition is performed on a GM client.");
  return a + b;
}
*/
