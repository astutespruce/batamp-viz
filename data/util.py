def to_nested_json(filename, df, field_name):
    with open(filename, "w") as out:
        out.write(
            '{{"{field_name}": {data}}}'.format(
                field_name=field_name, data=df.to_json(orient="records")
            )
        )


def camelcase(fields):
    def to_camel(string):
        if not "_" in string:
            return string

        parts = string.split("_")
        return "".join(
            [parts[0]] + ["{0}{1}".format(p[0].upper(), p[1:]) for p in parts[1:]]
        )

    return [to_camel(f) for f in fields]
