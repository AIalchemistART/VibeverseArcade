# 🔍 **AI Alchemist's Lair - Local Project Rules**

_Specific rules for this codebase that complement global coding standards_

[Back to Top](#🔍-ai-alchemists-lair---local-project-rules)

---

## 🥇 **Critical — Project-Specific Standards**

### ✨ **1. Prevent Core File Bloating**
- 🔄 Move new features to dedicated submodules instead of adding to core files
- **Critical files** to protect from bloating:
  - `main.js` (coordinate modules but delegate specific functionality)
  - `scene.js` (rendering pipeline, but scene-specific logic should be in separate modules)
  - Any file exceeding 200-300 lines should be refactored into smaller modules

### 🛠️ **2. Module Dependencies**
- Keep module interdependencies minimal and explicit
- Avoid circular dependencies between modules
- Document all module dependencies at the top of each file

### 🔌 **3. Plugin Architecture**
- Design for extensibility via plugins/modules that hook into the core
- New game features should be self-contained modules that register with relevant systems

---

## 🥈 **High Priority — Maintainability**

### 📊 **4. Performance Logging**
- Include performance monitoring for resource-intensive operations
- Add toggleable debug logs for camera, input, and rendering operations

### 🔍 **5. Input System Expansion**
- Add new input methods via the input module's registration system
- Keep input processing logic separated from the main game loop

### 🧩 **6. Event System**
- Use event-based communication between modules where appropriate
- Reduce direct coupling between game subsystems

---

## 🥉 **Medium Priority — Workflow Standards**

### 📝 **7. Documentation Standards**
- All new modules must include JSDoc comments
- Keep the PROGRESS_LOG.md updated with implementation details
- Document any browser-specific workarounds

### 🔢 **8. Version Control**
- Create meaningful commit messages that reference the Phase/Feature
- Group related changes into single commits where possible

### 🌐 **9. Asset Management**
- All game assets should be loaded through the asset manager
- Use consistent naming conventions for assets

---

## ⚙️ **Lower Priority — Good Practices**

### 🎮 **10. User Experience Consistency**
- Maintain consistent controls across gameplay modes
- Ensure visual feedback for all user interactions

### 🧪 **11. Testing**
- Add manual test procedures for new features
- Document expected behavior for complex interactions

### 🔄 **12. Refactoring Guidelines**
- Schedule regular refactoring for complex or growing modules
- Maintain a technical debt log for future improvements

---

*Last updated: March 27, 2025*
