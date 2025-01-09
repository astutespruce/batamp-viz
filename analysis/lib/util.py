import re


def to_nested_json(filename, df, field_name):
    with open(filename, "w") as out:
        out.write('{{"{field_name}": {data}}}'.format(field_name=field_name, data=df.to_json(orient="records")))


def camelcase(df):
    """return a copy of the data frame with all fields camelCased

    Parameters
    ----------
    df : DataFrame
    """

    def to_camel(string):
        if "_" not in string:
            return string

        parts = string.split("_")
        return "".join([parts[0]] + ["{0}{1}".format(p[0].upper(), p[1:]) for p in parts[1:]])

    return df.rename(columns={c: to_camel(c) for c in df.columns})


def from_camelcase(value):
    """Split a "TitleCase" name into "Title Case"

    Parameters
    ----------
    value : str

    Returns
    -------
    str
    """

    return " ".join(re.sub("([A-Z][a-z]+)", r" \1", re.sub("(?<=[a-z])([A-Z0-9]+)", r" \1", value)).split())


def get_min_uint_dtype(max_value):
    if max_value < 255:
        return "uint8"
    if max_value < 65535:
        return "uint16"
    if max_value < 4294967295:
        return "uint32"
    return "uint"
