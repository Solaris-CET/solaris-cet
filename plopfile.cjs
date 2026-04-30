module.exports = function (plop) {
  plop.setGenerator("component", {
    description: "Create a React component (+ optional Storybook story) in app/src",
    prompts: [
      {
        type: "input",
        name: "name",
        message: "Component name (PascalCase):",
      },
      {
        type: "input",
        name: "dir",
        message: "Target directory:",
        default: "app/src/components",
      },
      {
        type: "confirm",
        name: "withStory",
        message: "Add a Storybook story?",
        default: true,
      },
    ],
    actions: function (data) {
      const actions = [
        {
          type: "add",
          path: "{{dir}}/{{pascalCase name}}.tsx",
          templateFile: "plop-templates/component/component.hbs",
        },
      ];
      if (data && data.withStory) {
        actions.push({
          type: "add",
          path: "{{dir}}/{{pascalCase name}}.stories.tsx",
          templateFile: "plop-templates/component/story.hbs",
        });
      }
      return actions;
    },
  });
};

