import TestingCenter from '../Testing/TestingCenter';

/**
 * Settings section wrapper that embeds the testing center experience.
 *
 * @returns Container rendering the interactive testing center content.
 */
function TestingSettings() {
  return (
    <div className="testing-settings">
      <TestingCenter />
    </div>
  );
}

export default TestingSettings;

