import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, KeyboardAvoidingView, FlatList, Text, Platform, ScrollView } from 'react-native';
import ActionSheet from 'react-native-actionsheet';
import { renderPostBody } from '@ecency/render-helper';

// Utils
import Formats from './formats/formats';
import applyImageLink from './formats/applyWebLinkFormat';

// Components
import { IconButton } from '../../iconButton';
import { PostBody } from '../../postElements';
import { StickyBar } from '../../basicUIElements';
import { TextInput } from '../../textInput';
// Components
import { TitleArea, TagArea, TagInput, SummaryArea } from '../../index';

import { ThemeContainer } from '../../../containers';

// Styles
import styles from './markdownEditorStyles';

const MarkdownEditorView = ({
  draftBody,
  handleIsFormValid,
  handleOpenImagePicker,
  intl,
  isPreviewActive,
  isReply,
  isLoading,
  initialFields,
  onChange,
  handleOnTextChange,
  handleIsValid,
  componentID,
  uploadedImage,
  isEdit,
  post,
  fields,
  onTagChanged,
  onTitleChanged,
  getCommunity,
}) => {
  const [text, setText] = useState(draftBody || '');
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [editable, setEditable] = useState(true);
  const [height, setHeight] = useState(0);

  const inputRef = useRef(null);
  const galleryRef = useRef(null);
  const clearRef = useRef(null);

  useEffect(() => {
    if (!isPreviewActive) {
      _setTextAndSelection({ selection: { start: 0, end: 0 }, text });
    }
  }, [isPreviewActive]);

  useEffect(() => {
    if (text === '' && draftBody !== '') {
      _setTextAndSelection({ selection: { start: 0, end: 0 }, text: draftBody });
    }
  }, [draftBody]);

  useEffect(() => {
    if (editable === null) {
      // workaround for android context menu issue
      setEditable(false);
      setTimeout(() => {
        setEditable(!isLoading);
      }, 100);
    } else {
      setEditable(!isLoading);
    }
  }, [isLoading]);

  useEffect(() => {
    if (uploadedImage && uploadedImage.url) {
      applyImageLink({
        text,
        selection,
        setTextAndSelection: _setTextAndSelection,
        item: { url: uploadedImage.url, text: uploadedImage.hash },
        isImage: !!uploadedImage,
      });
    }
  }, [uploadedImage]);

  useEffect(() => {
    setText(draftBody);
  }, [draftBody]);

  useEffect(() => {
    const nextText = text.replace(text, '');

    if (nextText && nextText.length > 0) {
      _changeText(text);

      if (handleIsFormValid) {
        handleIsFormValid(text);
      }
    }
  }, [text]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const _changeText = useCallback((input) => {
    setText(input);

    if (onChange) {
      onChange(input);
    }

    if (handleIsValid) {
      handleIsValid(componentID, !!(input && input.length));
    }

    if (handleOnTextChange) {
      handleOnTextChange(input);
    }
  });

  const _handleOnSelectionChange = async (event) => {
    setSelection(event.nativeEvent.selection);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const _setTextAndSelection = useCallback(({ selection: _selection, text: _text }) => {
    inputRef.current.setNativeProps({
      text: _text,
    });

    // Workaround for iOS selection update issue
    const isIos = Platform.OS === 'ios';
    if (isIos) {
      setTimeout(() => {
        inputRef.current.setNativeProps({
          selection: _selection,
        });
        setSelection(_selection);
      }, 100);
    } else {
      inputRef.current.setNativeProps({
        selection: _selection,
      });
      setSelection(_selection);
    }
    _changeText(_text);
  });

  const _renderPreview = () => (
    <ScrollView style={styles.previewContainer}>
      {text ? (
        <PostBody body={renderPostBody(text, true, Platform.OS === 'ios' ? false : true)} />
      ) : (
        <Text>...</Text>
      )}
    </ScrollView>
  );

  const _renderMarkupButton = ({ item }) => (
    <View style={styles.buttonWrapper}>
      <IconButton
        size={20}
        style={styles.editorButton}
        iconStyle={styles.icon}
        iconType={item.iconType}
        name={item.icon}
        onPress={() =>
          item.onPress({ text, selection, setTextAndSelection: _setTextAndSelection, item })
        }
      />
    </View>
  );

  const _renderEditorButtons = () => (
    <StickyBar>
      <View style={styles.leftButtonsWrapper}>
        <FlatList
          data={Formats}
          keyboardShouldPersistTaps="always"
          renderItem={({ item, index }) => index !== 9 && _renderMarkupButton({ item })}
          horizontal
        />
      </View>
      <View style={styles.rightButtonsWrapper}>
        <IconButton
          size={20}
          style={styles.rightIcons}
          iconStyle={styles.icon}
          iconType="FontAwesome"
          name="link"
          onPress={() =>
            Formats[9].onPress({ text, selection, setTextAndSelection: _setTextAndSelection })
          }
        />
        <IconButton
          onPress={() => galleryRef.current.show()}
          style={styles.rightIcons}
          size={20}
          iconStyle={styles.icon}
          iconType="FontAwesome"
          name="image"
        />
        <View style={styles.clearButtonWrapper}>
          <IconButton
            onPress={() => clearRef.current.show()}
            size={20}
            iconStyle={styles.clearIcon}
            iconType="FontAwesome"
            name="trash"
            backgroundColor={styles.clearButtonWrapper.backgroundColor}
          />
        </View>
      </View>
    </StickyBar>
  );

  const _handleClear = (index) => {
    if (index === 0) {
      initialFields();
      setText('');
      _setTextAndSelection({ text: '', selection: { start: 0, end: 0 } });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      keyboardVerticalOffset={Platform.select({ ios: 0, android: 30 })}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView>
        {isReply && !isEdit && <SummaryArea summary={post.summary} />}
        {!isReply && (
          <TitleArea
            value={fields.title}
            onChange={onTitleChanged}
            componentID="title"
            intl={intl}
          />
        )}
        {!isReply && !isPreviewActive && (
          <TagInput
            value={fields.tags}
            componentID="tag-area"
            intl={intl}
            handleTagChanged={onTagChanged}
            setCommunity={getCommunity}
          />
        )}
        {!isReply && isPreviewActive && (
          <TagArea
            draftChips={fields.tags.length > 0 ? fields.tags : null}
            componentID="tag-area"
            intl={intl}
          />
        )}
        {!isPreviewActive ? (
          <ThemeContainer>
            {({ isDarkTheme }) => (
              <TextInput
                multiline
                autoCorrect={true}
                autoFocus={isReply ? true : false}
                onChangeText={_changeText}
                onSelectionChange={_handleOnSelectionChange}
                placeholder={intl.formatMessage({
                  id: isReply ? 'editor.reply_placeholder' : 'editor.default_placeholder',
                })}
                placeholderTextColor={isDarkTheme ? '#526d91' : '#c1c5c7'}
                selectionColor="#357ce6"
                style={styles.textWrapper}
                underlineColorAndroid="transparent"
                innerRef={inputRef}
                editable={editable}
                contextMenuHidden={false}
                autoGrow={false}
                scrollEnabled={false}
              />
            )}
          </ThemeContainer>
        ) : (
          _renderPreview()
        )}
      </ScrollView>
      {!isPreviewActive && _renderEditorButtons()}
      <ActionSheet
        ref={galleryRef}
        options={[
          intl.formatMessage({
            id: 'editor.open_gallery',
          }),
          intl.formatMessage({
            id: 'editor.capture_photo',
          }),
          intl.formatMessage({
            id: 'alert.cancel',
          }),
        ]}
        cancelButtonIndex={2}
        onPress={(index) => {
          handleOpenImagePicker(index === 0 ? 'image' : index === 1 && 'camera');
        }}
      />
      <ActionSheet
        ref={clearRef}
        title={intl.formatMessage({
          id: 'alert.clear_alert',
        })}
        options={[
          intl.formatMessage({
            id: 'alert.clear',
          }),
          intl.formatMessage({
            id: 'alert.cancel',
          }),
        ]}
        cancelButtonIndex={1}
        onPress={_handleClear}
      />
    </KeyboardAvoidingView>
  );
};

export default MarkdownEditorView;
