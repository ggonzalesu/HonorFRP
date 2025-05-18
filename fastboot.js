const fastboot = {
    device: null,
    endpointIn: null,
    endpointOut: null,
  
    async connect() {
      const filters = [{ vendorId: 0x18D1 }]; // Google vendor ID, adjust as needed
      this.device = await navigator.usb.requestDevice({ filters });
  
      await this.device.open();
      await this.device.selectConfiguration(1);
      await this.device.claimInterface(0);
  
      const endpoints = this.device.configuration.interfaces[0].alternate.endpoints;
      this.endpointIn = endpoints.find(ep => ep.direction === "in").endpointNumber;
      this.endpointOut = endpoints.find(ep => ep.direction === "out").endpointNumber;
  
      log("✅ Dispositivo conectado.");
    },
  
    async command(cmd) {
      const buffer = new TextEncoder().encode(cmd.padEnd(64, '\0'));
      await this.device.transferOut(this.endpointOut, buffer);
  
      let result = await this.device.transferIn(this.endpointIn, 64);
      const text = new TextDecoder().decode(result.data).replace(/\0/g, '');
      return text;
    }
  };
  
  function log(message) {
    const logBox = document.getElementById("log");
    logBox.textContent += message + "\n";
    logBox.scrollTop = logBox.scrollHeight;
  }
  
  document.getElementById("connectBtn").addEventListener("click", async () => {
    try {
      await fastboot.connect();
      document.getElementById("readInfoBtn").disabled = false;
    } catch (err) {
      log("❌ Error al conectar: " + err.message);
    }
  });
  
  document.getElementById("readInfoBtn").addEventListener("click", async () => {
    const commands = ["getvar:product", "getvar:version", "getvar:serialno", "getvar:unlocked"];
  
    for (const cmd of commands) {
      try {
        const response = await fastboot.command(cmd);
        log(`🟢 ${cmd} → ${response}`);
      } catch (err) {
        log(`🔴 Error al ejecutar "${cmd}": ${err.message}`);
      }
    }
  });
  