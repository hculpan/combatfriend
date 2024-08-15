let combatFriendConfig;

Hooks.once("init", function () {
  registerData();
});

Hooks.on("ready", function () {
  combatFriendConfig = new CombatFriendConfig();

  combatFriendConfig.gmInit = game.settings.get("combatfriend", "gmInit");
  combatFriendConfig.partyInit = game.settings.get("combatfriend", "partyInit");
  combatFriendConfig.round = game.settings.get("combatfriend", "round");

  combatFriendConfig.render(true, { userId: game.userId });
});

function registerData() {
  game.settings.register("combatfriend", "gmInit", {
    name: "GM Init",
    hint: "",
    scope: "world",
    config: true,
    type: Number,
    default: 0,
  });
  game.settings.register("combatfriend", "partyInit", {
    name: "Party Init",
    hint: "",
    scope: "world",
    config: true,
    type: Number,
    default: 0,
  });
  game.settings.register("combatfriend", "round", {
    name: "Round",
    hint: "",
    scope: "world",
    config: true,
    type: Number,
    default: 0,
  });
}

function nextRound(gm, party, round) {
  combatFriendConfig.gmInit = gm;
  combatFriendConfig.partyInit = party;
  combatFriendConfig.round = round;

  combatFriendConfig.render(true);
}

function saveData() {
  game.settings.set("combatfriend", "gmInit", combatFriendConfig.gmInit);
  game.settings.set("combatfriend", "partyInit", combatFriendConfig.partyInit);
  game.settings.set("combatfriend", "round", combatFriendConfig.round);
}

class CombatFriendConfig extends FormApplication {
  gmInit = 0;
  partyInit = 0;
  round = 0;

  static get defaultOptions() {
    const defaults = super.defaultOptions;

    let startWidth = 300;
    let startHeight = 315;

    const overrides = {
      height: "auto",
      id: "combatfriend",
      template: "modules/combatfriend/templates/combatfriend.hbs",
      title: "Combat Friend",
      userId: game.userId,
      resizable: false,
      width: startWidth,
      height: startHeight,
      left: canvas.app.screen.width - ui.sidebar.element.width() - startWidth - 20,
      top: canvas.app.screen.height - startHeight - 20,
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
        combatFriendConfig.round += 1;
        combatFriendConfig.gmInit = 1;
        combatFriendConfig.partyInit = 1;
        while (combatFriendConfig.gmInit === combatFriendConfig.partyInit) {
          combatFriendConfig.gmInit = Math.floor(Math.random() * 6 + 1);
          combatFriendConfig.partyInit = Math.floor(Math.random() * 6 + 1);
        }
        saveData();
        break;
      }

      case "end": {
        combatFriendConfig.round = 0;
        break;
      }
    }

    combatFriendConfig.render(true);
  }

  render(force = false, options = {}) {
    if (game.users.current.id === game.users.activeGM?.id) {
      super.render(force, options);
    }
  }

  getData(options) {
    let initWinner = combatFriendConfig.partyInit > combatFriendConfig.gmInit ? "Players" : "Enemies";
    if (combatFriendConfig.round === 0) {
      initWinner = "Not determined yet";
    }
    return {
      gm: combatFriendConfig.gmInit,
      party: combatFriendConfig.partyInit,
      round: combatFriendConfig.round,
      isGM: game.users.current.id === game.users.activeGM?.id,
      initWinner: initWinner,
    };
  }
}
