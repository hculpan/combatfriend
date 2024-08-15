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
  game.settings.register("combatfriend", "timers", {
    name: "Timers",
    hint: "",
    scope: "world",
    config: true,
    type: Array,
    default: [],
  });
}

function nextRound(gm, party, round) {
  combatFriendConfig.gmInit = gm;
  combatFriendConfig.partyInit = party;
  combatFriendConfig.round = round;
  combatFriendConfig.timers = timers;

  combatFriendConfig.render(true);
}

function saveData() {
  game.settings.set("combatfriend", "gmInit", combatFriendConfig.gmInit);
  game.settings.set("combatfriend", "partyInit", combatFriendConfig.partyInit);
  game.settings.set("combatfriend", "round", combatFriendConfig.round);
  game.settings.set("combatfriend", "timers", combatFriendConfig.timers);
}

class CombatFriendConfig extends FormApplication {
  gmInit = 0;
  partyInit = 0;
  round = 0;
  timers = [];

  static get defaultOptions() {
    const defaults = super.defaultOptions;

    let startWidth = 300;
    let startHeight = 365;

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
      case "start":
        if (combatFriendConfig.round === 0) {
          combatFriendConfig.gmInit = 0;
          combatFriendConfig.partyInit = 0;
          combatFriendConfig.round = 0;
          saveData();
        }
        break;

      case "next": {
        combatFriendConfig.round += 1;
        combatFriendConfig.gmInit = 1;
        combatFriendConfig.partyInit = 1;
        while (combatFriendConfig.gmInit === combatFriendConfig.partyInit) {
          combatFriendConfig.gmInit = Math.floor(Math.random() * 6 + 1);
          combatFriendConfig.partyInit = Math.floor(Math.random() * 6 + 1);
        }

        ChatMessage.create({
          content: `
            <div>
              <h3>Initiative for round ${combatFriendConfig.round}</h3>
              <div>Players rolled ${combatFriendConfig.partyInit}<br>GM rolled ${combatFriendConfig.gmInit}</div>
              <hr>
              <div style="text-align: center;">
                <div style="font-size:26px; font-weight: bold;">${
                  combatFriendConfig.partyInit > combatFriendConfig.gmInit ? "Party goes first!" : "Enemies go first!"
                }</div>
              </div>
            </div>`,
          whisper: [], // Ensure the message is public by setting whisper to an empty array
        });

        combatFriendConfig.timers.forEach((item) => {
          item.remaining -= 1;
        });
        combatFriendConfig.timers = combatFriendConfig.timers.filter((item) => {
          if (item.remaining === 0) {
            ui.notifications.warn(`${item.name} expires this round${item.npcTimer ? " (NPC)" : ""}.`);
            if (!item.npcTimer) {
              ChatMessage.create({
                content: `${item.name} expired this round.`,
                whisper: [], // Ensure the message is public by setting whisper to an empty array
              });
            }
          }
          return item.remaining !== 0;
        });

        saveData();
        break;
      }

      case "end": {
        combatFriendConfig.round = 0;
        break;
      }

      case "add-timer":
        openCreateTimerDialog();
        break;

      case "clear-timers":
        combatFriendConfig.timers = [];
        saveData();
        combatFriendConfig.render(true);
    }

    combatFriendConfig.render(true);
  }

  removeTimer(index) {
    combatFriendConfig.timers.splice(index, 1);
  }

  render(force = false, options = {}) {
    if (game.users.current.id === game.users.activeGM?.id) {
      super.render(force, options);
    }
  }

  getData(options) {
    return {
      gm: combatFriendConfig.gmInit,
      party: combatFriendConfig.partyInit,
      round: combatFriendConfig.round,
      isGM: game.users.current.id === game.users.activeGM?.id,
      timers: combatFriendConfig.timers,
    };
  }
}
function openCreateTimerDialog() {
  new Dialog({
    title: "Create Timer",
    content: `
      <form>
        <div class="form-group">
          <label for="timer-name">Timer Name:</label>
          <input type="text" id="timer-name" name="timer-name">
        </div>
        <div class="form-group">
          <label for="timer-rounds">Rounds:</label>
          <input type="number" id="timer-rounds" name="timer-rounds" min="1">
        </div>
        <div class="form-group">
          <label for="non-player-timer">Non-Player Timer:</label>
          <input type="checkbox" id="non-player-timer" name="non-player-timer">
        </div>
      </form>
    `,
    buttons: {
      create: {
        icon: "<i class='fas fa-check'></i>",
        label: "Create",
        callback: (html) => {
          const timerName = html.find('[name="timer-name"]').val();
          const timerRounds = parseInt(html.find('[name="timer-rounds"]').val());
          const nonPlayerTimer = html.find('[name="non-player-timer"]').is(":checked");

          combatFriendConfig.timers.push({ name: timerName, remaining: timerRounds, npcTimer: nonPlayerTimer });

          if (!nonPlayerTimer) {
            ChatMessage.create({
              content: `
              <div>
                <h3>Timer added in round ${combatFriendConfig.round}</h3>
                <div>${timerName} is now in effect and will end at the end of round ${
                combatFriendConfig.round + timerRounds
              }</div>
              </div>`,
              whisper: [], // Ensure the message is public by setting whisper to an empty array
            });
          }

          combatFriendConfig.render(true);
        },
      },
      cancel: {
        icon: "<i class='fas fa-times'></i>",
        label: "Cancel",
      },
    },
    default: "create",
    close: () => {
      // Optional: Handle anything you need when the dialog is closed without creating a timer
    },
  }).render(true);
}
