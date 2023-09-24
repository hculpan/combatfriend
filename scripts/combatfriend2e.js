let combatFriend2eConfig;

Hooks.on("init", function () {
  registerData();
});

Hooks.on("ready", function () {
  combatFriend2eConfig = new CombatFriend2eConfig();

  combatFriend2eConfig.gmInit = game.settings.get("combatfriend2e", "gmInit");
  combatFriend2eConfig.partyInit = game.settings.get("combatfriend2e", "partyInit");
  combatFriend2eConfig.round = game.settings.get("combatfriend2e", "round");

  combatFriend2eConfig.render(true, { userId: game.userId });
});

Hooks.once("socketlib.ready", () => {
  socket = socketlib.registerModule("combatfriend2e");
  socket.register("next", nextRound);
});

function registerData() {
  game.settings.register("combatfriend2e", "gmInit", {
    name: "GM Init",
    hint: "",
    scope: "world",
    config: true,
    type: Number,
    default: 0,
  });
  game.settings.register("combatfriend2e", "partyInit", {
    name: "Party Init",
    hint: "",
    scope: "world",
    config: true,
    type: Number,
    default: 0,
  });
  game.settings.register("combatfriend2e", "round", {
    name: "Round",
    hint: "",
    scope: "world",
    config: true,
    type: Number,
    default: 0,
  });
}

function nextRound(gm, party, round) {
  combatFriend2eConfig.gmInit = gm;
  combatFriend2eConfig.partyInit = party;
  combatFriend2eConfig.round = round;

  combatFriend2eConfig.render(true);
}

function saveData() {
  game.settings.set("combatfriend2e", "gmInit", combatFriend2eConfig.gmInit);
  game.settings.set("combatfriend2e", "partyInit", combatFriend2eConfig.partyInit);
  game.settings.set("combatfriend2e", "round", combatFriend2eConfig.round);
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
        saveData();
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
    return {
      gm: combatFriend2eConfig.gmInit,
      party: combatFriend2eConfig.partyInit,
      round: combatFriend2eConfig.round,
      isGM: game.users.current.id === game.users.activeGM?.id,
    };
  }
}
