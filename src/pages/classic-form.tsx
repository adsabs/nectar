import Button from '@components/base/button';

const Home: React.FC = () => {
  return (
    <>
      <div className="leading-loose flex justify-center">
        <form
          method="get"
          action="search"
          className="max-w-2xl m-4 p-10 bg-white rounded shadow-xl"
        >
          {renderCollectionCheckboxes(['astronomy'])}
          {renderTextarea({ label: 'Author' })}

          {/* <div className="mt-3">
            <Textarea
              name="author"
              label={
                <div className="flex justify-between items-center">
                  <p>Author</p>
                  <div>
                    <Radio name="authorLogic" defaultChecked>
                      AND
                    </Radio>
                    <Radio name="authorLogic">OR</Radio>
                  </div>
                </div>
              }
            />
          </div>

          <div className="mt-3">
            <Textarea
              label={
                <div className="flex justify-between items-center">
                  <p>Object</p>
                  <div>
                    <Radio name="objectLogic" defaultChecked>
                      AND
                    </Radio>
                    <Radio name="objectLogic">OR</Radio>
                  </div>
                </div>
              }
            />
          </div> */}
          {/* 
          <div className="mt-3">
            <Textbox label="Publication date" />

          </div> */}

          <div className="mt-4">
            <Button type="submit">Submit</Button>
          </div>
        </form>
      </div>
    </>
  );
};

const renderTextarea = ({
  label,
  placeholder,
}: {
  label: string;
  placeholder?: string;
}) => {
  return (
    <label className="block">
      <span className="text-gray-700">{label}</span>
      <textarea
        className="form-textarea mt-1 block w-full"
        rows={3}
        placeholder={placeholder}
        defaultValue={''}
      />
    </label>
  );
};

const renderTextInput = (label: string) => {
  return (
    <label className="block">
      <span className="text-gray-700">{label}</span>
      <input
        type="email"
        className="form-input mt-1 block w-full"
        placeholder="john@example.com"
      />
    </label>
  );
};

const renderCollectionCheckboxes = (selected: string[]) => {
  return (
    <div className="flex items-center">
      <span className="mr-1">Limit query to:</span>
      <>
        {['astronomy', 'physics', 'general'].map((label) => (
          <label className="inline-flex items-center mx-1">
            <input
              type="checkbox"
              className="form-checkbox"
              name={`collection-${label}`}
              defaultChecked={selected.includes(label)}
            />
            <span className="ml-2 capitalize">{label}</span>
          </label>
        ))}
      </>
    </div>
  );
};

export default Home;
