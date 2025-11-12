import TestingTutorial from '../Testing/TestingTutorial';

/**
 * Settings section wrapper that embeds the testing tutorial experience.
 *
 * @returns Container rendering the interactive testing tutorial content.
 */
function TestingSettings() {
  return (
    <div className="testing-settings">
      <TestingTutorial />
    </div>
  );
}

export default TestingSettings;

